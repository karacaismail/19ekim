// Yalnız kullanılan ECharts modülleri: çubuk, çizgi, nokta, huni (piramit), pasta, ağaç; SVG çizici.
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, LineChart, PieChart, ScatterChart, TreeChart } from 'echarts/charts';
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
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
  SVGRenderer,
]);

export { echarts };
