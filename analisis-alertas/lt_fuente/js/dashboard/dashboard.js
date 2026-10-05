// Libreria js para graficos estadísticos
// V a r i a b l e s    g l o b a l e s

var option;						// Opciones para el grafico
let Id_refreshInterval = 0;		// Id para el manejo del Intervalo de refresco de indices
let refreshInterval = 120 * 1000;	// 2 minutos = 120 * 1000
let specialfunctionsActive = false; // Variable para controlar la activación de funciones especiales

$(function () {
   
   InitializeControls();  

});

function InitializeControls() {

    var redirect = 1;
	if (perfilUsuario !== undefined && perfilUsuario !== null && perfilUsuario !== '') {
		var perfil = JSON.parse(perfilUsuario);

		perfil.Permisos.forEach(function (permiso) {
			if (permiso.IdPermiso === "DASHBOARD") { redirect = 0; }	
			if (permiso.IdPermiso === "SUPERVISOR") { specialfunctionsActive = true; }
		});

	}
	if (redirect === 1) {
		window.location.href = '/Home';
		window.location.href = '/Home';
	}

    // Funciones especiales para supervisores
	if (specialfunctionsActive) {
		$('#cmbCentro').hide();
		$("#lblCentro").text("Estadísticas de los centros");
		$('#dvGeoCentro').hide();

		$('#btnGetStatistics').show();
		$('#dvGeoRelacionCentro').show();

		$('#btnGetStatistics').on('click', function () {
			LoadStatistics('', perfil.Usuario.IdPerfil, perfil.Usuario.Id);
		});

	} else {
		$('#btnGetStatistics').hide();
		$('#dvGeoRelacionCentro').hide();
		$('#dvGeoCentro').show();
	}


	$('#title-page').html("Dashboard");
	
	$('#PanelGrafico').show();
	$('#total_recorridos').text('0');
	$('#total_entregas').text('0');
	$('#total_retiros').text('0');
	$('#uso_de_en_camino').text('% 0');

	$('#porc_total_entregas').html('% 0');
	$('#porc_total_retiros').html('% 0');

	$('#download-sin-geo').hide();
	$('#download-reporte-recorridos').hide();
	$('#download-visitas_fallidas').hide();
	$('#download-geo-incorrecta').hide();
	$('#download-desvio-geo').hide();

	$('#info-dir-geo-incorrecta').hide();
	$('#info-dir-sin-geo').hide();
	$('#info-visitas-fallidas').hide();
	$('#info-desvio-geo').hide();

	// Descarga de info *************************************
	$('#download-sin-geo').on('click', function () {
		var centerId = $('#cmbCentro').val();
		let mensaje = '';
		showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Descargando la información aguarde un momento'), 2);

		DownloadMaterialReport(centerId);
	});
	$('#download-reporte-recorridos').on('click', function () {
		var centerId = $('#cmbCentro').val();
		if (!centerId) return;
		showPopupTimer('popup_timer', 'Descargando la información aguarde un momento', 2);
		$.ajax({
			url: '/api/Recorrido/ReporteRecorridos',
			type: 'GET',
			dataType: 'json',
			data: { centro: centerId },
			success: function (data) {
				if (!Array.isArray(data) || !data.length) return;
				var headers = Object.keys(data[0]);
				var rows = [headers].concat(data.map(function (r) { return headers.map(function (h) { return r[h] != null ? r[h] : ''; }); }));
				var contenido = '\uFEFF' + 'sep=,\r\n' + rows.map(function (cols) { return cols.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
				var blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
				var url = URL.createObjectURL(blob);
				var a = document.createElement('a');
				a.href = url;
				a.download = 'reporte_recorridos_' + centerId + '.csv';
				document.body.appendChild(a); a.click(); document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		});
	});
	$('#download-visitas_fallidas').on('click', function () {
		var centerId = $('#cmbCentro').val();
		let mensaje = '';
		showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Descargando la información aguarde un momento'), 2);

		DownloadFailedVisitReport(centerId);
	})
	$('#download-geo-incorrecta').on('click', function () {
		var centerId = $('#cmbCentro').val();
		let mensaje = '';
		showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Descargando la información aguarde un momento'), 2);

		DownloadGeoErrorReport(centerId);
	});
	$('#download-desvio-geo').on('click', function () {
		var centerId = $('#cmbCentro').val();
		let mensaje = '';
		showPopupTimer('popup_timer', (mensaje !== undefined && mensaje !== '' ? mensaje : 'Descargando la información aguarde un momento'), 2);

		DownloadDesvioGeoReport(centerId);
	});
	// **************** *************************************

	// Refresco automatico de recorridos
	Id_refreshInterval = RestartInterval(RefreshStatistics, Id_refreshInterval, refreshInterval);
	ActivateMenu('Menu_Dashboard');

	//clearInterval(Id_refreshInterval); 
	//Id_refreshInterval = setInterval(RefreshStatistics, refreshInterval);


	return;
}

function RefreshStatistics() {

	var center = $('#cmbCentro').val();

	if (center !== undefined)
		if(center !== '' && center !== null)
			LoadStatistics(center);
}

// Llamada a la api de datos
function LoadStatistics(center='', perfil='', usuario=''){

	//window.alert(center);	

	var request = {
		Centro: center,
		IdPerfil: perfil,
		IdUsuario: usuario
	};

	showOverlay(true);

	$.ajax({
		url: '/Dashboard/GetStatistics', // ruta al método del controlador
		type: 'POST',          // o 'POST' si está configurado así
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(request),
		success: function (data) { 

			showOverlay(false);
			//$('#resultado').html(response);
			if (data != "") {
				let graphicsdataMaterials = [];
				let graphicsdataReasons = [];
				let graphicsdataWithoutGeo = [];
				let graphicsdataDesvioGeo = [];

				// Completar labels de los cards

				$('#total_recorridos').text(data.cantidades[0].cantidadRecorridos.toLocaleString('es-AR', {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}));
				if (data.cantidades[0].cantidadRecorridos > 0) { $('#download-reporte-recorridos').show(); }
				$('#total_entregas').text(data.cantidades[0].totalEntregas.toLocaleString('es-AR', {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}));
				$('#total_retiros').text(data.cantidades[0].totalRetiros.toLocaleString('es-AR', {
					minimumFractionDigits: 0,
					maximumFractionDigits: 0
				}));
				let porcEnCamino = (data.cantidades[0].visitadasEnCamino * 100) / (data.cantidades[0].visitadasTotales <= 0 ? 1 : data.cantidades[0].visitadasTotales);
				$('#uso_de_en_camino').text('% ' + porcEnCamino.toLocaleString('es-AR', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}));
				let noEntregados = data.cantidades[0].totalEntregas - data.cantidades[0].visitadosEntregas;
				let porcNoEntregados =100 - ( (noEntregados * 100) / (data.cantidades[0].totalEntregas <= 0 ? 1 : data.cantidades[0].totalEntregas));
				$('#porc_total_entregas').html('% ' + porcNoEntregados.toLocaleString('es-AR', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}));
				let noRetirados = data.cantidades[0].totalRetiros - data.cantidades[0].visitadosRetiro;
				let porcNoRetirados = 100 - ( (noRetirados * 100) / (data.cantidades[0].totalRetiros <= 0 ? 1 : data.cantidades[0].totalRetiros) );
				$('#porc_total_retiros').html('% ' + porcNoRetirados.toLocaleString('es-AR', {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2
				}));

				$('#total-dir-geo-incorrecta').html(data.cantidades[0].geoIncorrecta);
				$('#total-dir-sin-geo').html(data.cantidades[0].direccionesSinGeo);
				$('#total-visitas-fallidas').html(data.cantidades[0].visitadasFallidasTotales);
				$('#total-desvio-geo').html(data.cantidades[0].desvioGeo);

				let differenceGeo = (100-data.cantidades[0].porcentajeConGEOIncorrecta);
				graphicsdataWithoutGeo.push({
					value: differenceGeo,
					name: 'Geo correcta',
					quantity: 0
				});
				graphicsdataWithoutGeo.push({
					value: data.cantidades[0].porcentajeConGEOIncorrecta.toFixed(2),
					name: 'Geo incorrecta',
                    quantity: data.cantidades[0].geoIncorrecta
				});


				let differenceDesvioGeo = (100-data.cantidades[0].porcentajeConDesvioGeo);
				graphicsdataDesvioGeo.push({
					value: differenceDesvioGeo,
					name: 'Sin desvio Geo',
                    quantity: 0
				});
				graphicsdataDesvioGeo.push({
					value: Number(data.cantidades[0].porcentajeConDesvioGeo.toFixed(2)),
					name: 'Con desvío > 700 mts',
					quantity: data.cantidades[0].desvioGeo
				});
				// Grafico

				data.materiales.forEach(item => {
					// Ejemplo { value: 850, name: 'Sin Geo'}
					graphicsdataMaterials.push({value: item.cantidad , name: item.descripcion, quantity: item.cantidad  });					
				});

				BuildGraph('pieChart-dir-sin-geo', graphicsdataMaterials, 'Sin GEO por material', 'Info', 0, 360);

				data.motivosFallidas.forEach(item => {
					graphicsdataReasons.push({ value: item.cantidad, name: item.descripcionMotivo, quantity: item.cantidad  });
				});
				BuildGraph('pieChart-visitas-fallidas', graphicsdataReasons, 'Visitas fallidas', 'Info', 0, 360);


				BuildGraph('pieChart-dir-geo-incorrecta', graphicsdataWithoutGeo, 'Con marca de GEO Incorrecta', 'Info', 180, 0);

				BuildGraph('pieChart-desvio-geo', graphicsdataDesvioGeo, 'Desvio GEO 700 mts', 'Info', 180, 0);


				if (graphicsdataMaterials.length > 0) { $('#download-sin-geo').show(); $('#info-dir-sin-geo').show(); }
				else { $('#download-sin-geo').hide(); $('#info-dir-sin-geo').hide(); }

				if (graphicsdataReasons.length > 0) { $('#download-visitas_fallidas').show(); $('#info-visitas-fallidas').show(); }
				else { $('#download-visitas_fallidas').hide(); $('#info-visitas-fallidas').hide(); }

				if (graphicsdataWithoutGeo.length > 0) { $('#download-geo-incorrecta').show(); $('#info-dir-geo-incorrecta').show(); }
				else { $('#download-geo-incorrecta').hide(); $('#info-dir-geo-incorrecta').hide(); }

				if (graphicsdataDesvioGeo.length > 0) { $('#download-desvio-geo').show(); $('#info-desvio-geo').show(); }
				else { $('#download-desvio-geo').hide(); $('#info-desvio-geo').hide(); }

					

				$('#PanelGrafico').show();
			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			showOverlay(false);
			$('#resultado').html('Error al llamar al servidor' + jqXHR);
		}
	});
	
}

//
// Grafico
//

function LoadGraphByCenter(centerId) {


	//var data = [
	//	{ value: 850, name: 'Sin Geo', link: 'https://ocasa.com/' },
	//	{ value: 1450, name: 'Con Geo asignada', link: 'https://ocasa.com/' },
	//	{ value: 280, name: 'Datos faltantes', link: 'https://ocasa.com/' },
	//	{ value: 2000, name: 'Entregados', link: 'https://ocasa.com/' },
	//	{ value: 590, name: 'No entregados', link: 'https://ocasa.com/' }
	//];

	//var data_geo_incorrecta = [
	//	{ value: 30, name: 'Geo Incorrectas' },
	//	{ value: 70, name: 'Geo Correctas' }
	//]
	//var data_bar = [60];



	//BuildGraph('pieChart-dir-sin-geo', data, 'Direcciones sin Geo por material', 'Info', 0, 360);
	//BuildGraph('pieChart-dir-geo-incorrecta', data_geo_incorrecta, 'Paradas con Geo Incorrecta', 'Info', 180, 360);
	//BuildBar('barra_porc_total_entregas', data_bar);

}

function BuildGraph(containerId, data, titulo = 'Gráfico Pie Dinámico', tooltip_title='Info', startAngle=0, endAngle=360) {
	// Obtener el contenedor por su id
	var chartDom = document.getElementById(containerId);
	if (!chartDom) {
	console.error('No se encontró el contenedor con id:', containerId);
	return;
	}

	// Inicializar ECharts en el contenedor
	var Chart = echarts.init(chartDom);
	const total = data.reduce((acc, item) => acc + Number(item.value), 0);
	const isSmallScreen = window.innerWidth < 1250;
	// Configuración del gráfico con datos dinámicos
	option = {    
	//  tooltip: {
	//    trigger: 'item',
		// formatter: function(params) {
		//// params.value es el valor, params.name es el nombre del segmento
		//// params.percent es el porcentaje calculado por ECharts
		//return `${params.name}: ${params.value} (${params.percent}%)`;
	//}
		//  },
		tooltip: {
			trigger: 'item',
			formatter: function (params) {
				return `
						${params.marker}
						<b>${params.name}</b><br/>
						Cantidad: <b>${Number(params.data.quantity).toLocaleString('es-AR')}</b><br/>
						Porcentaje: <b>${params.percent.toLocaleString('es-AR', {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})} %
					`;
			}
		},
		legend: {
			right: -10,          // posición desde el borde derecho
			top: 70,		
			height: 160,
			//left: 'center',
			type: 'scroll',
			orient: 'vertical',  	// Orientación vertical para la leyenda
			//right: 0,           		// Margen derecho del contenedor
			//top: 'middle',        	// Centramos verticalmente la leyenda
			textStyle: {
				//fontSize: 10
				fontSize: isSmallScreen ? 8 : 10
			}
		},
		series: [
			{
			name: tooltip_title,
			type: 'pie',
			//radius: '50%',		// Torta completa
			//radius: ['40%', '70%'], // Tipo anillo
				radius: isSmallScreen ? ['20%', '50%'] : ['30%', '60%'],
				//center: ['30%', '50%'], // Alineacion del grafico 
				center: isSmallScreen ? ['20%', '50%'] : ['20%', '50%'],

			avoidLabelOverlap: false,
			startAngle: startAngle,          // 180 hace un semi circulo
			endAngle: endAngle,          // 360
			itemStyle: {
				borderRadius: 5,
				borderColor: '#fff',
				borderWidth: 2
			},
			label: {
				show: false,
				position: 'center'
			},
			emphasis: {
				label: {
				show: true,
				fontSize: '18',
				fontWeight: 'bold'
				}
				,
				itemStyle: {
				shadowBlur: 10,
				shadowOffsetX: 0,
				shadowColor: 'rgba(0, 0, 0, 0.5)'
				}
			},
			labelLine: {
				show: true
			},		
			data: data,
        
		
			}
		],
		title: {
			text: titulo,
			top: '-5px', // separa el título hacia abajo
			left: 'left',
			textStyle: {
				fontSize: isSmallScreen ? 16 : 18
			}
		},
  };

  // Asignar la configuración y renderizar el gráfico
  Chart.setOption(option);

  Chart.on('click', function(params) {
    const datoOriginal = data.find(d => d.name === params.name);
    if (datoOriginal && datoOriginal.link) {
      window.open(datoOriginal.link, '_blank');
    }
  });

  // Ajustar tamaño del gráfico al cambiar la ventana
  window.addEventListener('resize', () => {
    Chart.resize();
  });

  return Chart; // Opcional, para tener referencia al gráfico creado
}

function BuildBar(containerId , data) {
	var chartDom = document.getElementById(containerId);
	if (!chartDom) {
		console.error('No se encontró el contenedor con id:', containerId);
		return;
	}
	var myChart = echarts.init(chartDom);

	var option = {
		xAxis: {
			type: 'value',
			max: 100,
			//axisLabel: { formatter: '{value} %' }
			axisLabel: {
				fontFamily: 'Arial, sans-serif',
				fontSize: 10,
				color: '#333'
			}
		},
		yAxis: {
			type: 'category',
			data: ['A']
		},
		series: [
			{
				type: 'bar',
				data: [60],
				label: {
					show: false,
					position: 'right',
					formatter: '{c} %'
				}
			}
		]
	};
	myChart.setOption(option);

}

function showOverlay(visible) {
	
	if (visible) {
		//$('#block_screen').fadeIn();
		//$('#block_screen').show();
		$('#block_screen').removeClass('hidden').addClass('visible');
	}
	else {
		//$('#block_screen').fadeOut();
		//$('#block_screen').hide();
		$('#block_screen').removeClass('visible').addClass('hidden');
	}
}

function DownloadMaterialReport(idcenter) {

	var request = {
		Centro: idcenter
	};

	$.ajax({
		url: '/Dashboard/GetMaterialReport', // ruta al método del controlador
		type: 'POST',          // o 'POST' si está configurado así
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(request),
		success: function (data) {
			//showOverlay(false);

			let exists = Object.keys(data).includes('statusCode');
			if (!exists) {

                DownloadDetail("Material", data);
			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			//showOverlay(false);
			$('#resultado').html('Error al llamar al servidor' + jqXHR);
		}
	});


}
function DownloadFailedVisitReport(idcenter) {
	var request = {
		Centro: idcenter
	};

	$.ajax({
		url: '/Dashboard/GetFailedVisitReport', // ruta al método del controlador
		type: 'POST',          // o 'POST' si está configurado así
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(request),
		success: function (data) {
			//showOverlay(false);

			if (data != "") {

				let exists = Object.keys(data).includes('statusCode');
				if (!exists) {

					DownloadDetail("VisitasFallidas", data);
				}


			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			//showOverlay(false);
			$('#resultado').html('Error al llamar al servidor' + jqXHR);
		}
	});
}

function DownloadGeoErrorReport(idcenter) {
	var request = {
		Centro: idcenter
	};

	$.ajax({
		url: '/Dashboard/GetGeoErrorReport', // ruta al método del controlador
		type: 'POST',          // o 'POST' si está configurado así
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(request),
		success: function (data) {
			//showOverlay(false);

			if (data != "") {

				let exists = Object.keys(data).includes('statusCode');
				if (!exists) {

					DownloadDetail("GeoIncorrecta", data);
				}


			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			//showOverlay(false);
			$('#resultado').html('Error al llamar al servidor' + jqXHR);
		}
	});
}

function DownloadDesvioGeoReport(idcenter) {
	var request = {
		Centro: idcenter
	};

	$.ajax({
		url: '/Dashboard/GetGeoDeviationReport', // ruta al método del controlador
		type: 'POST',          // o 'POST' si está configurado así
		contentType: 'application/json',
		dataType: 'json',
		data: JSON.stringify(request),
		success: function (data) {
			//showOverlay(false);

			if (data != "") {

				let exists = Object.keys(data).includes('statusCode');
				if (!exists) {

					DownloadDetail("DesvioGeo", data);
				}

			}

		},
		error: function (jqXHR, textStatus, errorThrown) {
			//showOverlay(false);
			$('#resultado').html('Error al llamar al servidor' + jqXHR);
		}
	});
}


function DownloadDetail(reportType, records) {

	let nombreArchivo = 'Informe_';
	let data = '';
	var today = new Date();
	let yyyy = today.getFullYear();
	let MM = today.getMonth() + 1; // Months start at 0!
	let dd = today.getDate();
	let hh = today.getHours();
	let mm = today.getMinutes();
	let ss = today.getSeconds();

	let formattedDate = yyyy + '' + MM + dd + hh + mm + ss;

	switch (reportType) {
		case "Material":
			data += 'Centro;Recorrido;Ruta;Nro Parada;ID Transportista;Nombre Transportista;Equipo;Guía;Destinatario;Tipo Serv;Desc Tipo Serv;Material;Descripción;Pais;Dirección;Código Postal;Localidad\n';
			records.forEach((item) => {

				data += item.centro + ';' + item.recorrido + ';' + item.ruta + ';' + item.nro_Parada + ';' + item.chofer.replace(/;/g, ' ') + ';' +
					item.conductor.replace(/;/g, ' ') + ';' +
					item.equipo + ';' + item.guia + ';' + item.destinatario.replace(/;/g, ' ') + ';' + item.tipoServ + ';' + item.tipoDeServicio + ';' +
					item.material + ';' + item.descripcion.replace(/;/g, ' ') + ';' + item.pais + ';' + item.direccion.replace(/;/g, ' ') + ';' +
					item.codigoPostal + ';' + item.localidad.replace(/;/g,' ') + '\n';
			})
			nombreArchivo = nombreArchivo + 'Materiales_'
			break;
		case "VisitasFallidas":
			data += 'Centro;Geo Planificada;Geo Real;Recorrido;Ruta;Nro Parada;ID Transportista;Nombre Transportista;Eqipo;Guía;Destinatario;Tipo Serv;Desc Tipo Serv;Material;Descripción;Pais;Dirección;Código Postal;Localidad;Motivo;Desc_Larga\n';
			records.forEach((item) => {

				data += item.centro + ';' + item.geoPlanificada + ';' + item.geoReal + ';' + item.recorrido + ';' + item.ruta + ';' + item.nro_Parada + ';' + item.chofer.replace(/;/g, ' ') + ';' +
					item.conductor.replace(/;/g, ' ') + ';' +
					item.equipo + ';' + item.guia + ';' + item.destinatario.replace(/;/g, ' ') + ';' + item.tipoServ + ';' + item.tipoDeServicio + ';' +
					item.material + ';' + item.descripcion.replace(/;/g, ' ') + ';' + item.pais + ';' + item.direccion.replace(/;/g, ' ') + ';' +
					item.codigoPostal + ';' + item.localidad.replace(/;/g, ' ') + ';' + item.reasonCode + ';' + item.desc_Larga.replace(/;/g,' ') + '\n';
			})
			nombreArchivo = nombreArchivo + 'VisitasFallidas_'
			break;
		case "GeoIncorrecta":
			data += 'Centro;Geo Planificada;Geo Real;Recorrido;Ruta;Nro Parada;ID Transportista;Nombre Transportista;Equipo;Guía;Destinatario;Tipo Serv;Desc Tipo Serv;Material;Descripción;País;Dirección;Código Postal;Localidad;Motivo;Desc_Larga\n';
			records.forEach((item) => {

				data += item.centro + ';' + item.geoPlanificada + ';' + item.geoReal + ';' + item.recorrido + ';' + item.ruta + ';' + item.nro_Parada + ';' + item.chofer.replace(/;/g, ' ') + ';' +
					item.conductor.replace(/;/g, ' ') + ';' +
					item.equipo + ';' + item.guia + ';' + item.destinatario.replace(/;/g, ' ') + ';' + item.tipoServ + ';' + item.tipoDeServicio + ';' +
					item.material + ';' + item.descripcion.replace(/;/g, ' ') + ';' + item.pais + ';' + item.direccion.replace(/;/g, ' ') + ';' +
					item.codigoPostal + ';' + item.localidad.replace(/;/g, ' ') + ';' + item.reasonCode + ';' + item.desc_Larga.replace(/;/g, ' ') + '\n';
			})
			nombreArchivo = nombreArchivo + 'GeoIncorrecta_'
			break;	
		case "DesvioGeo":
			data += 'Distancia (metros);Centro;Geo Planificada;Geo Real;Recorrido;Ruta;Nro Parada;ID Transportista;Nombre Transportista;Equipo;Guía;Destinatario;Tipo Serv;Desc Tipo Serv;Material;Descripción;País;Dirección;Código Postal;Localidad;Motivo, Desc_Larga\n';
			records.forEach((item) => {

				data += item.distancia + ';' + item.centro + ';' + item.geoPlanificada + ';' + item.geoReal + ';' + item.recorrido + ';' + item.ruta + ';' + item.nro_Parada + ';' + item.chofer.replace(/;/g, ' ') + ';' +
					item.conductor.replace(/;/g, ' ') + ';' +
					item.equipo + ';' + item.guia + ';' + item.destinatario.replace(/;/g, ' ') + ';' + item.tipoServ + ';' + item.tipoDeServicio + ';' +
					item.material + ';' + item.descripcion.replace(/;/g, ' ') + ';' + item.pais + ';' + item.direccion.replace(/;/g, ' ') + ';' +
					item.codigoPostal + ';' + item.localidad.replace(/;/g, ' ') + ';' + item.reasonCode + ';' + item.desc_Larga.replace(/;/g, ' ') + '\n';
			})
			nombreArchivo = nombreArchivo + 'GeoConDesvio_'
			break;
	}


	var BOM = "\uFEFF";
	var textFile = new Blob([BOM + data], {
		type: 'text/plain;charset=utf-8'
	});
	invokeSaveAsDialog(textFile, nombreArchivo + formattedDate+'.csv');
}