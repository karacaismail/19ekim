// Yalnız kullanılan ECharts modülleri: çubuk, çizgi, huni (piramit) ve pasta; SVG çizici.
import * as echarts from 'echarts/core';
import { BarChart, FunnelChart, LineChart, PieChart } from 'echarts/charts';
import { AriaComponent, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([BarChart, LineChart, FunnelChart, PieChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, AriaComponent, SVGRenderer]);

export { echarts };
