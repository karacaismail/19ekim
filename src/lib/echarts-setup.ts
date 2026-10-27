// Yalnız kullanılan ECharts modülleri: çubuk, çizgi, nokta, huni (piramit), pasta, ağaç; işaret çizgisi/alanı/noktası; SVG çizici.
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, LineChart, PieChart, ScatterChart, TreeChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  FunnelChart,
  PieChart,
  TreeChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  MarkPointComponent,
  SVGRenderer,
]);

export { echarts };
