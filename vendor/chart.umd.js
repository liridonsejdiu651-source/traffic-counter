<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datasource-prometheus@2/dist/chartjs-plugin-datasource-prometheus.umd.min.js" crossorigin="anonymous"></script>
<canvas id="myChart"></canvas>
<script>
 const ctx = document.getElementById('myChart').getContext('2d');
 const myChart = new Chart(ctx, {
   type: 'line',
   plugins: [ChartDatasourcePrometheusPlugin],
   options: {
     plugins: {
       'datasource-prometheus': {
         prometheus: {
           endpoint: "https://prometheus.demo.do.prometheus.io",
         },
         query: 'sum by (job) (go_gc_duration_seconds)',
         timeRange: {
           type: 'relative',
           start: -12 * 60 * 60 * 1000, // 12 hours ago
           end: 0, // now
         },
       },
     },
   },
 });
</script>
