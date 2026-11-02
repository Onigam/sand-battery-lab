import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import { SCALE_SILOS, type SandSim } from '../sim/engine';
import { STRATEGIES, type Strategy } from '../sim/operate';
import { kAtMidSwing, type MediumId } from '../sim/silo';
import { PRESET_IDS, rangeOf, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import {
  CURVE_SHARES,
  type CapacityPoint,
  type CapacityResult,
  type GamePlan,
  type ScaleRow,
  type YearResult,
} from '../sim/runs';
import type { PresetId, SandParams, ScenarioId } from '../sim/types';
import { PRICE_WEEKS, type PriceWeekId, type Season } from '../sim/week';
import {
  BLOCKS_PER_DAY,
  BLOCK_HOURS,
  blockOn,
  budgetSegments,
  capacityChartData,
  energy,
  mainReadouts,
  makerPoint,
  moreReadouts,
  niceCeil3,
  powersChartData,
  scaleLine,
  sectionChartData,
  setBlock,
  sinceReadouts,
  specificHeatChartData,
  statusOf,
  tempsChartData,
  weekChartData,
  yearChartData,
  wholeShares,
  yearReadouts,
  type Readout,
} from './model';
import { dayNames, months, num, st, sx, unitGap, type PanelKey } from './strings';
import { monthOf } from './strip';

// Simulation mode: starting points and scenarios, a few live figures, where the heat of the stone goes, then everything else folded: the
// machine, the inside, the network, the rule, the failures, the game, all the figures, and the charts. Built only from the kit's widgets and charts.

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

/** Real seconds the machine must stay unchanged before the runs behind the charts start again. */
const QUIET = 0.35;

interface Control {
  key: keyof SandParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
}

const dayLabel = (d: number): string => `${Math.floor(d) + 1}`;

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private lesson = h('div', {});
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private budget = h('div', { class: 'losses' });
  private budgetNote = h('div', {});
  private more = h('div', { class: 'loss-legend' });
  private since = h('div', { class: 'loss-legend' });
  private yearBox = h('div', { class: 'loss-legend' });
  private orderBox = h('div', { class: 'loss-legend' });
  private scaleBox = h('div', { class: 'loss-legend' });
  private powerTitle = h('div', { class: 'eyebrow' }, '');
  private capacityTitle = h('div', { class: 'eyebrow' }, '');
  private yearTitle = h('div', { class: 'eyebrow' }, '');
  private gameGrid = h('div', {});
  private gameScore = h('div', { class: 'loss-legend' });
  private gameWin = h('div', {});
  private computing = h('p', { class: 'hint' });
  private controls: Control[] = [];

  private tempChart: LineChart;
  private powerChart: LineChart;
  private sectionChart: LineChart;
  private capacityChart: LineChart;
  private weekChart: LineChart;
  private cChart: LineChart;
  private yearChart: LineChart;
  private yearMeanChart: LineChart;
  private tempOpts: ChartOpts;
  private powerOpts: ChartOpts;
  private sectionOpts: ChartOpts;
  private capacityOpts: ChartOpts;
  private weekOpts: ChartOpts;
  private yearOpts: ChartOpts;
  private yearMeanOpts: ChartOpts;

  private lastReadouts = 0;
  private lastLive = 0;
  private key = '';
  private wait = 0;
  /** The long runs still to do, one a frame, so that none of them holds a frame back by more than a few tens of ms. */
  private jobs: (() => void)[] = [];
  private capacityData: CapacityResult | null = null;
  private curveData: CapacityPoint[] | null = null;
  private orderData: ReturnType<SandSim['getChargeOrder']> | null = null;
  private scaleData: ScaleRow[] | null = null;
  private yearData: YearResult | null = null;
  private gameData: GamePlan | null = null;
  private scenario: ScenarioId | null = null;

  constructor(private ctx: AppContext<SandSim>) {
    const sim = () => this.ctx.sim;
    const days = (v: number) => (v === 0 ? '0' : `${num(v, Math.abs(v) < 2 ? 1 : 0)} ${st('unitDays')}`);
    const deg = (v: number) => `${num(v)} °C`;
    this.tempOpts = {
      height: 130,
      series: [
        { key: 'core', label: () => st('seriesCore'), color: SERIES_COLORS.dump },
        { key: 'mean', label: () => st('seriesMean'), color: SERIES_COLORS.load, bold: true },
        { key: 'edge', label: () => st('seriesEdge'), color: SERIES_COLORS.hydro },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: days,
    };
    this.tempChart = new LineChart(this.tempOpts);
    this.powerOpts = {
      height: 130,
      series: [
        { key: 'heater', label: () => st('seriesHeater'), color: SERIES_COLORS.dump },
        { key: 'heat', label: () => st('seriesHeat'), color: SERIES_COLORS.load, bold: true },
        { key: 'boiler', label: () => st('seriesBoiler'), color: SERIES_COLORS.pv },
        { key: 'walls', label: () => st('seriesWalls'), color: SERIES_COLORS.hydro, dash: true },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: days,
    };
    this.powerChart = new LineChart(this.powerOpts);
    this.sectionOpts = {
      height: 130,
      series: [
        { key: 'top', label: () => st('seriesTop'), color: SERIES_COLORS.dump },
        { key: 'middle', label: () => st('seriesMiddle'), color: SERIES_COLORS.load, bold: true },
        { key: 'bottom', label: () => st('seriesBottom'), color: SERIES_COLORS.hydro },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v, v < 3 ? 2 : 1)} m`,
    };
    this.sectionChart = new LineChart(this.sectionOpts);
    this.capacityOpts = {
      height: 140,
      series: [{ key: 'usable', label: () => st('seriesUsable'), color: SERIES_COLORS.load, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: (v) => `${num(v, v < 10 ? 1 : 0)} ${sim().params.ratedPower >= 0.9e6 ? 'MW' : 'kW'}`,
      markers: () => {
        const p = sim().params;
        const k = p.ratedPower >= 0.9e6 ? 1e6 : 1e3;
        const marks: ReturnType<NonNullable<ChartOpts['markers']>> = [{ x: p.ratedPower / k, label: st('markRated') }];
        if (p.silo === 'pornainen' && p.medium === 'soapstone') {
          marks.push({ x: makerPoint.power, y: makerPoint.usable, label: st('markMaker'), color: SERIES_COLORS.dump });
        }
        return marks;
      },
    };
    this.capacityChart = new LineChart(this.capacityOpts);
    this.weekOpts = {
      height: 130,
      series: [
        { key: 'price', label: () => st('seriesPrice'), color: SERIES_COLORS.dump, bold: true },
        { key: 'plan', label: () => st('seriesPlan'), color: SERIES_COLORS.load },
      ],
      yFmt: (v) => num(v),
      xFmt: (v) => `${dayNames()[Math.floor(v / 24) % 7]} ${Math.floor(v % 24)}h`,
      markers: () => {
        const s = sim().state;
        return [{ x: (Math.floor(s.day) * 24 + Math.floor(s.hour)) % 168, label: st('markNow') }];
      },
    };
    this.weekChart = new LineChart(this.weekOpts);
    this.cChart = new LineChart({
      height: 120,
      series: [
        { key: 'sand', label: () => st('seriesSand'), color: SERIES_COLORS.dump, bold: true },
        { key: 'quartz', label: () => st('seriesQuartz'), color: SERIES_COLORS.pv },
        { key: 'soapstone', label: () => st('seriesSoapstone'), color: SERIES_COLORS.load },
        { key: 'fixed', label: () => st('seriesFixed'), color: SERIES_COLORS.hydro, dash: true },
      ],
      yMin: 0.6,
      yMax: 1.2,
      yFmt: (v) => num(v, 1),
      xFmt: deg,
    });
    this.yearOpts = {
      height: 120,
      series: [
        { key: 'heat', label: () => st('seriesDayHeat'), color: SERIES_COLORS.load, bold: true },
        { key: 'boiler', label: () => st('seriesBoiler'), color: SERIES_COLORS.pv },
      ],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: (d) => `${dayLabel(d)} · ${months()[monthOf(d)]}`,
    };
    this.yearChart = new LineChart(this.yearOpts);
    this.yearMeanOpts = {
      height: 90,
      series: [{ key: 'mean', label: () => st('chartYearT'), color: SERIES_COLORS.dump, bold: true }],
      yMin: 0,
      yFmt: (v) => num(v),
      xFmt: (d) => `${dayLabel(d)} · ${months()[monthOf(d)]}`,
    };
    this.yearMeanChart = new LineChart(this.yearMeanOpts);
  }

  /** Apply a change live; the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<SandParams>): void {
    this.ctx.sim.set(patch);
    this.scenario = null;
    this.renderLesson();
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.controls = [];

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.scenario = null;
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, sx('preset', id))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (key: keyof SandParams, el: HTMLElement, kind: Control['kind'], fmt?: (v: number) => string) => {
      this.controls.push({ key, el, kind, fmt });
      return el;
    };
    const slider = (key: PanelKey, field: RangedKey, fmt: (v: number) => string) => {
      const r = rangeOf(field, p.silo);
      return track(
        field,
        kitSlider(st(key), p[field] as number, r.min, r.max, r.step, fmt, (v) =>
          this.set({ [field]: v } as Partial<SandParams>),
        ),
        'slider',
        fmt,
      );
    };
    const toggle = (key: PanelKey, field: 'demandOn' | 'blowerFailed' | 'interlock' | 'reserveCall') =>
      track(
        field,
        kitToggle(st(key), p[field], (v) => this.set({ [field]: v } as Partial<SandParams>)),
        'toggle',
      );
    const pick = <T extends string>(
      key: PanelKey,
      field: keyof SandParams,
      options: [T, string][],
      then?: () => void,
    ) =>
      track(
        field,
        kitSelect<T>(st(key), p[field] as unknown as T, options, (v) => {
          this.set({ [field]: v } as Partial<SandParams>);
          then?.();
        }),
        'select',
      );
    const hint = (key: PanelKey) => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = false;
      return d;
    };
    const powerText = (v: number) =>
      v >= 1e6 ? `${num(v / 1e6, 2)} MW` : v >= 1e4 ? `${num(v / 1e3)} kW` : `${num(v / 1e3, 1)} kW`;
    const deg = (v: number) => `${num(v)} °C`;
    const metres = (v: number) => `${num(v, 2)} m`;

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, st('simTitle2')),
      hint('simIntro'),
      hint('tagLegend'),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      h('div', { class: 'eyebrow' }, st('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id) =>
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                sim.applyScenario(id);
                this.scenario = id;
                this.render();
              },
            },
            sx('scenario', id),
          ),
        ),
      ),
      this.lesson,
      this.status,
      this.readouts,
      hint('levelHint'),
      h('div', { class: 'eyebrow' }, st('budgetTitle')),
      this.budget,
      this.budgetNote,
      hint('budgetHint'),
      folded(
        st('secMachine'),
        pick<MediumId>('medium', 'medium', [
          ['soapstone', sx('medium', 'soapstone')],
          ['sand', sx('medium', 'sand')],
        ]),
        hint('mediumHint'),
        slider('ratedPower', 'ratedPower', powerText),
        slider('chargePower', 'chargePower', powerText),
        hint('chargeHint'),
        slider('fullMeanT', 'fullMeanT', deg),
        slider('coreLimit', 'coreLimit', deg),
        slider('chargeAirT', 'chargeAirT', deg),
        hint('tempHint'),
      ),
      folded(
        st('secInside'),
        slider('pitch', 'pitch', metres),
        hint('pitchHint'),
        slider('kScale', 'kScale', (v) => `${num(kAtMidSwing({ medium: sim.params.medium, kScale: v }), 2)} W/m·K`),
        slider('insulation', 'insulation', metres),
        slider('lambda', 'lambda', (v) => `${num(v, 2)} W/m·K`),
        hint('insulationHint'),
        slider('blowerPerMW', 'blowerPerMW', (v) => `${num(v, 1)} m³/s/MW`),
        hint('blowerHint'),
      ),
      folded(
        st('secNetwork'),
        toggle('demandOn', 'demandOn'),
        slider('supplyT', 'supplyT', deg),
        slider('returnT', 'returnT', deg),
        pick<Season>('season', 'season', [
          ['year', st('seasonYear')],
          ['winter', st('seasonWinter')],
          ['summer', st('seasonSummer')],
        ]),
        slider('outsideShift', 'outsideShift', (v) => `${v > 0 ? '+' : ''}${num(v)} K`),
        hint('networkHint'),
      ),
      folded(
        st('secRule'),
        pick<Strategy>(
          'strategy',
          'strategy',
          STRATEGIES.map((id) => [id, sx('strategy', id)] as [Strategy, string]),
        ),
        slider('threshold', 'threshold', (v) => `${num(v)} €/MWh`),
        pick<PriceWeekId>('priceWeek', 'priceWeek', [
          ['drawn', st('weekDrawn')],
          ['windless', st('weekWindless')],
          ['negative', st('weekNegative')],
        ]),
        pick<SandParams['chargeOrder']>('chargeOrder', 'chargeOrder', [
          ['core-first', st('orderCore')],
          ['even', st('orderEven')],
        ]),
        hint('ruleHint'),
      ),
      folded(
        st('secFaults'),
        toggle('blowerFailed', 'blowerFailed'),
        toggle('interlock', 'interlock'),
        toggle('reserveCall', 'reserveCall'),
        hint('faultHint'),
      ),
      folded(
        st('secGame'),
        hint('gameIntro'),
        this.gameGrid,
        this.gameScore,
        this.gameWin,
        h(
          'div',
          { class: 'part-chips' },
          h(
            'button',
            { class: 'part-chip', onclick: () => this.paint(new Array<boolean>(168).fill(false)) },
            st('gameClear'),
          ),
          h(
            'button',
            { class: 'part-chip', onclick: () => this.gameData && this.paint(this.gameData.plan) },
            st('gameCheap'),
          ),
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                this.set({ strategy: 'painted', season: 'winter' });
                this.render();
              },
            },
            st('gameUse'),
          ),
        ),
        hint('gameHint'),
      ),
      folded(st('moreTitle'), this.more, h('div', { class: 'eyebrow' }, st('moreSince')), this.since),
      h('div', { class: 'eyebrow' }, `${st('chartSection')} (°C)`),
      this.sectionChart.el,
      hint('chartSectionHint'),
      h('div', { class: 'eyebrow' }, `${st('chartTemps')} (°C)`),
      this.tempChart.el,
      this.powerTitle,
      this.powerChart.el,
      this.capacityTitle,
      this.capacityChart.el,
      hint('chartCapacityHint'),
      h('div', { class: 'eyebrow' }, `${st('chartWeek')} (€/MWh)`),
      this.weekChart.el,
      hint('chartWeekHint'),
      h('div', { class: 'eyebrow' }, st('chartOrder')),
      this.orderBox,
      h('div', { class: 'eyebrow' }, st('chartScale')),
      this.scaleBox,
      hint('scaleHint'),
      this.yearTitle,
      this.yearChart.el,
      this.yearMeanChart.el,
      this.yearBox,
      hint('efficiencyHint'),
      h('div', { class: 'eyebrow' }, `${st('chartC')} (kJ/kg·K)`),
      this.cChart.el,
      hint('chartCHint'),
      this.computing,
    );
    const c = specificHeatChartData();
    this.cChart.setData(c.xs, { sand: c.sand, quartz: c.quartz, soapstone: c.soapstone, fixed: c.fixed });
    fill(this.capacityTitle, st('chartCapacity'));
    fill(this.yearTitle, st('chartYear'));
    this.key = this.runKey();
    this.wait = 0;
    this.jobs = this.makeJobs();
    this.renderLesson();
    this.renderGame();
    this.refresh();
  }

  /** Called every frame while the panel is open: figures at 5 Hz, the live charts at 2 Hz, one long run at a time. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastLive += dt;
    this.schedule(dt);
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastLive > 0.5) {
      this.lastLive = 0;
      this.drawLive();
    }
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawLive();
    this.drawStatic();
  }

  // ------------------------------------------------------------------ the long runs

  /** Everything the runs depend on. */
  private runKey(): string {
    const p = this.ctx.sim.params;
    return JSON.stringify([
      p.silo,
      p.medium,
      p.ratedPower,
      p.chargePower,
      p.fullMeanT,
      p.coreLimit,
      p.chargeAirT,
      p.insulation,
      p.lambda,
      p.pitch,
      p.kScale,
      p.blowerPerMW,
      p.supplyT,
      p.returnT,
      p.season,
      p.strategy,
      p.threshold,
      p.priceWeek,
      p.chargeOrder,
    ]);
  }

  private schedule(dt: number): void {
    const key = this.runKey();
    if (key !== this.key) {
      this.key = key;
      this.wait = QUIET;
      this.jobs = [];
    } else if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) this.jobs = this.makeJobs();
    }
    const job = this.jobs.shift();
    if (!job) return;
    job();
    this.drawStatic();
  }

  private makeJobs(): (() => void)[] {
    const sim = this.ctx.sim;
    const curve: CapacityPoint[] = [];
    const rows: ScaleRow[] = [];
    return [
      () => (this.capacityData = sim.getCapacity()),
      ...CURVE_SHARES.map((_, i) => () => {
        curve.push(sim.getCapacityPoint(i));
        if (curve.length === CURVE_SHARES.length) this.curveData = curve;
      }),
      () => (this.orderData = sim.getChargeOrder()),
      () => {
        this.gameData = sim.getGamePlan();
        this.renderGame();
      },
      ...SCALE_SILOS.map((_, i) => () => {
        rows.push(sim.getScaleRow(i));
        if (rows.length === SCALE_SILOS.length) this.scaleData = rows;
      }),
      () => (this.yearData = sim.getYear()),
    ];
  }

  // ------------------------------------------------------------------ figures

  private renderLesson(): void {
    if (this.scenario)
      fill(this.lesson, h('div', { class: 'callout callout--tip' }, h('span', {}, sx('lesson', this.scenario))));
    else fill(this.lesson, h('p', { class: 'hint' }, st('scenarioHint')));
  }

  private renderStatus(): void {
    const sim = this.ctx.sim;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const { key, tone } = statusOf(sim.state, sim.params);
    fill(
      this.status,
      tone === 'warn'
        ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, st(key)))
        : h('p', { class: 'hint' }, st(key)),
    );
  }

  private renderReadouts(): void {
    const sim = this.ctx.sim;
    const box = (r: Readout) =>
      h(
        'div',
        { class: 'readout' },
        h('span', {}, st(r.key)),
        h('b', {}, num(r.value, r.digits), h('small', {}, `${unitGap(r.unit)}${r.unit}${r.tag ? ` ${r.tag}` : ''}`)),
      );
    const line = (r: Readout) =>
      h(
        'span',
        {},
        `${st(r.key)} `,
        h('b', {}, num(r.value, r.digits)),
        h('small', {}, `${unitGap(r.unit)}${r.unit}${r.tag ? ` ${r.tag}` : ''}`),
      );
    fill(this.readouts, ...mainReadouts(sim.state).map(box));
    fill(this.more, ...moreReadouts(sim.state, sim.mass).map(line));
    fill(this.since, ...sinceReadouts(sim.state).map(line));
  }

  private renderBudget(): void {
    const c = this.capacityData;
    const p = this.ctx.sim.params;
    if (!c) {
      fill(this.budget, h('p', { class: 'hint' }, st('computing')));
      return;
    }
    const rows = budgetSegments(c);
    const shares = wholeShares(rows.map((r) => r.joules));
    fill(
      this.budget,
      h(
        'div',
        { class: 'loss-bar', role: 'img', 'aria-label': st('budgetTitle') },
        ...rows.map((r) =>
          h('span', { style: `flex:${Math.max(r.joules, 1)};background:${r.colour}`, title: st(r.key) }),
        ),
      ),
      h(
        'div',
        { class: 'loss-legend' },
        ...rows.map((r, i) => {
          const e = energy(r.joules);
          return h(
            'span',
            {},
            h('i', { style: `background:${r.colour}` }),
            `${st(r.key)} `,
            h('b', {}, `${num(e.value, e.digits)} ${e.unit}`),
            h('small', {}, ` ${num(shares[i]!)}${unitGap('%')}% †`),
          );
        }),
      ),
    );
    const onMaker = p.silo === 'pornainen' && p.medium === 'soapstone';
    fill(this.budgetNote, onMaker ? h('p', { class: 'hint' }, st('budgetMaker')) : null);
  }

  private renderOrder(): void {
    const d = this.orderData;
    if (!d) return;
    const cell = (label: string, a: string, b: string) =>
      h('span', {}, `${label} `, h('b', {}, a), h('small', {}, ` / ${b} †`));
    const lost = (o: { lostInCharge: number }) => {
      const e = energy(o.lostInCharge);
      return `${num(e.value, e.digits)} ${e.unit}`;
    };
    fill(
      this.orderBox,
      h('span', {}, h('b', {}, st('orderCore')), h('small', {}, ` / ${st('orderEven')}`)),
      cell(
        st('orderHours'),
        `${num(d['core-first'].hours)} ${st('unitHours')}`,
        `${num(d.even.hours)} ${st('unitHours')}`,
      ),
      cell(st('orderLoss'), lost(d['core-first']), lost(d.even)),
      cell(st('orderWall'), `${num(d['core-first'].wallKW, 1)} kW`, `${num(d.even.wallKW, 1)} kW`),
      cell(st('orderEdge'), `${num(d['core-first'].edgeT)} °C`, `${num(d.even.edgeT)} °C`),
    );
  }

  private renderScale(): void {
    const rows = this.scaleData;
    if (!rows) return;
    fill(
      this.scaleBox,
      ...rows.map((r) => {
        const l = scaleLine(r);
        return h(
          'span',
          {},
          h('b', {}, st(l.key)),
          h(
            'small',
            {},
            ` ${st('scaleUsable')} ${num(l.usable.value, l.usable.digits)} ${l.usable.unit} · ${st('scaleHalfLife')} ${num(l.halfLife, l.halfLife < 10 ? 1 : 0)} ${st('unitDays')} · ${st('scaleSurface')} ${num(l.surfacePerVolume, 1)} /m · ${st('scaleEfficiency')} ${num(100 * l.efficiency)}${unitGap('%')}% †`,
          ),
        );
      }),
    );
  }

  /** A painted week becomes the parameters at once; only its score has to wait for a run. */
  private paint(plan: boolean[]): void {
    this.ctx.sim.set({ painted: plan });
    this.renderGame();
  }

  private renderGame(): void {
    const sim = this.ctx.sim;
    const plan = sim.params.painted;
    const names = dayNames();
    const rows: HTMLElement[] = [];
    for (let d = 0; d < 7; d++) {
      const chips: HTMLElement[] = [];
      for (let b = 0; b < BLOCKS_PER_DAY; b++) {
        const on = blockOn(plan, d, b);
        chips.push(
          h(
            'button',
            {
              class: `part-chip${on ? ' is-on' : ''}`,
              'aria-pressed': String(on),
              title: `${names[d]} ${b * BLOCK_HOURS}h`,
              onclick: () => this.paint(setBlock(plan, d, b, !on)),
            },
            String(b * BLOCK_HOURS).padStart(2, '0'),
          ),
        );
      }
      rows.push(h('div', { class: 'eyebrow' }, names[d]!), h('div', { class: 'part-chips' }, ...chips));
    }
    fill(this.gameGrid, ...rows);
    const you = sim.getPaintedWeek();
    const them = this.gameData?.result;
    const euros = (v: number) => `${num(v)} €`;
    fill(
      this.gameScore,
      h('span', {}, `${st('gameYou')} `, h('b', {}, euros(you.total)), h('small', {}, ' †')),
      them ? h('span', {}, `${st('gameOpponent')} `, h('b', {}, euros(them.total)), h('small', {}, ' †')) : null,
      h('span', {}, `${st('gameBoiler')} `, h('b', {}, euros(you.boilerCost)), h('small', {}, ' †')),
      h('span', {}, `${st('gameStock')} `, h('b', {}, euros(-you.stockValue)), h('small', {}, ' †')),
      them
        ? h('span', {}, `${st('gameDelta')} `, h('b', {}, euros(you.total - them.total)), h('small', {}, ' †'))
        : null,
    );
    fill(
      this.gameWin,
      them && you.total <= them.total
        ? h('div', { class: 'callout callout--tip' }, h('span', {}, st('gameBeat')))
        : null,
    );
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. */
  private followScript(): void {
    const p = this.ctx.sim.params;
    for (const c of this.controls) {
      const value = p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number' && Math.abs(Number(input.value) - value) > 1e-9) {
        input.value = String(value);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(value);
      }
    }
  }

  // ------------------------------------------------------------------ charts

  private drawLive(): void {
    const sim = this.ctx.sim;
    const t = tempsChartData(sim.scope);
    this.tempOpts.yMax = niceCeil3(Math.max(100, ...t.core, ...t.mean) * 1.05);
    this.tempChart.setData(t.xs, { core: t.core, mean: t.mean, edge: t.edge });
    this.tempChart.draw();
    const w = powersChartData(sim.scope);
    this.powerOpts.yMax = niceCeil3(Math.max(1, ...w.heater, ...w.heat, ...w.boiler) * 1.05);
    fill(this.powerTitle, `${st('chartPowers')} (${w.unit})`);
    this.powerChart.setData(w.xs, { heater: w.heater, heat: w.heat, boiler: w.boiler, walls: w.walls });
    this.powerChart.draw();
    const c = sectionChartData(sim.state);
    this.sectionOpts.yMax = niceCeil3(Math.max(100, ...c.top, ...c.middle, ...c.bottom) * 1.05);
    this.sectionChart.setData(c.xs, { top: c.top, middle: c.middle, bottom: c.bottom });
    this.sectionChart.draw();
    this.weekChart.draw();
  }

  private drawStatic(): void {
    const sim = this.ctx.sim;
    this.renderBudget();
    this.renderOrder();
    this.renderScale();
    if (this.curveData) {
      const d = capacityChartData(this.curveData);
      this.capacityOpts.yMax = niceCeil3(
        Math.max(...d.ys, sim.params.silo === 'pornainen' ? makerPoint.usable : 0) * 1.05,
      );
      fill(this.capacityTitle, `${st('chartCapacity')} (${d.yUnit})`);
      this.capacityChart.setData(d.xs, { usable: d.ys });
      this.capacityChart.draw();
    }
    const week = PRICE_WEEKS[sim.params.priceWeek];
    const plan =
      sim.params.strategy === 'painted'
        ? sim.params.painted
        : this.gameData?.plan && sim.params.strategy === 'optimal'
          ? this.gameData.plan
          : week.map(
              (v) =>
                sim.params.strategy === 'always' || (sim.params.strategy === 'threshold' && v <= sim.params.threshold),
            );
    const wk = weekChartData(week, plan);
    this.weekOpts.yMin = wk.bottom;
    this.weekOpts.yMax = niceCeil3(wk.top * 1.05);
    this.weekChart.setData(wk.xs, { price: wk.price, plan: wk.plan });
    this.weekChart.draw();
    this.cChart.draw();
    if (this.yearData) {
      const y = yearChartData(this.yearData);
      this.yearOpts.yMax = niceCeil3(Math.max(1, ...y.heat, ...y.boiler) * 1.05);
      fill(this.yearTitle, `${st('chartYear')} (${y.unit})`);
      this.yearChart.setData(y.xs, { heat: y.heat, boiler: y.boiler });
      this.yearChart.draw();
      this.yearMeanOpts.yMax = niceCeil3(Math.max(100, ...y.mean) * 1.05);
      this.yearMeanChart.setData(y.xs, { mean: y.mean });
      this.yearMeanChart.draw();
      const yr = yearReadouts(this.yearData);
      fill(
        this.yearBox,
        ...yr.map((r) =>
          h(
            'span',
            {},
            `${st(r.key)} `,
            h('b', {}, num(r.value, r.digits)),
            h('small', {}, `${unitGap(r.unit)}${r.unit} ${r.tag}`),
          ),
        ),
      );
    }
    this.computing.textContent = this.wait > 0 || this.jobs.length > 0 ? st('computing') : '';
  }
}
