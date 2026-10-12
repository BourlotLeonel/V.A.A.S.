# V.A.A.S. — Prototipo y evaluación del control semafórico

## Abrir

Abrir VAAS-demo.html en un navegador. El archivo integra código, plano y el ensayo de referencia, sin necesidad de instalación ni conexión a Internet. Para trabajar sobre el código, abrir index.html y conservar todos los archivos de esta carpeta. Recargar una pestaña ya abierta para aplicar cambios.

## Comparación visual en tiempo real

La pantalla principal muestra dos cruces lado a lado: dinámico y estático. Ambos comienzan en el mismo estado, avanzan con el mismo reloj y reciben cada lote de vehículos con idéntica llegada, clase, origen, ruta e identificador de muestra. Cada controlador maneja sus fases y colas independientemente.

Pausa, velocidad, demanda, mezcla, aceleración, pérdida de enlace y solicitud peatonal se aplican a ambos modelos. El control del panel izquierdo permanece dinámico y el derecho estático; se eliminó el selector que permitía cambiar el modelo de un solo panel. Reiniciar ambos devuelve los dos al mismo origen y semilla.

Las estadísticas de cada panel muestran entradas, salidas, cola, pendientes, detención media acumulada de todos y detención media de quienes salieron. La diferencia principal utiliza la misma muestra de entradas, incluyendo quienes siguen pendientes, y es parcial mientras no se complete. La media de salidas se muestra por separado, porque esos subconjuntos pueden ser distintos entre modelos.

Detener llegadas y vaciar suspende simultáneamente las entradas y mantiene ambos cruces avanzando hasta completar la muestra, momento en que se pausa el reloj. Reanudar llegadas reactiva las entradas compartidas; la pausa manual detiene los dos. Exportar comparación en vivo guarda ambas estadísticas en un mismo CSV e identifica si la muestra está completa. El ensayo por semillas se conserva más abajo como complemento independiente.

## Simulación

El cruce representa San Lorenzo Oeste, Próspero Bovino y 25 de Mayo en Concordia. Las huellas edilicias se aproximan al plano aportado por el usuario; las dimensiones no son un relevamiento catastral.

Un único acceso recibe verde por turno. La rotación circular es San Lorenzo desde el oeste → San Lorenzo desde el este → Bovino → 25 de Mayo → repetición; el dinámico puede omitir accesos vacíos. San Lorenzo y Bovino tienen doble sentido; 25 de Mayo únicamente permite ingreso hacia San Lorenzo. Están habilitadas todas las maniobras compatibles con esos sentidos: desde 25 de Mayo recto, izquierda o derecha; desde Bovino izquierda o derecha; desde San Lorenzo recto o hacia Bovino. Ningún vehículo sale hacia 25 de Mayo. No se modelan retornos en U.

El control dinámico asigna entre 8 y 35 s al verde según los vehículos que se aproximan o esperan en el acceso. Omite accesos sin demanda en la rotación circular; el estático conserva su ciclo fijo. El estático usa 30 s. La secuencia conserva amarillo de cierre de 3 s, despeje de al menos 2 s extendido mientras haya vehículos comprometidos o cruzando, amarillo previo al verde de 3 s y habilitación del próximo acceso. Si hay pedido peatonal, se intercalan 8 s con los cuatro accesos en rojo antes de preparar el siguiente verde. Si el enlace simulado pierde heartbeat durante 5 s, se adopta control estático local.

Los vehículos de un mismo acceso pueden seguirse durante su verde. La separación longitudinal se calcula con una regla simplificada inspirada en IDM; los giros reducen su velocidad objetivo. El modelo integra cada 0,05 s y dibuja continuamente. La velocidad 1× corresponde a un segundo simulado por segundo en primer plano; 3× y 10× aceleran el experimento. Una pestaña inactiva o un equipo lento pueden afectar esa relación, porque se limita la recuperación de tiempo para evitar saltos.

Las clases son auto, moto, colectivo y camión. La mezcla urbana usa 68%, 20%, 8% y 4%; la pesada 45%, 15%, 15% y 25%. La demanda es el total de cada eje, repartido entre sus dos accesos. Se usan llegadas pseudoaleatorias reproducibles; si el tramo de entrada está lleno, los vehículos esperan fuera de escena y se contabilizan. Las maniobras ilustrativas usan 80% recto en San Lorenzo, 40% recto desde 25 de Mayo y distribuyen el resto entre giros permitidos.

## Ensayo comparativo

La página muestra un resultado de referencia ya calculado. Ejecutar con la demanda actual realiza un nuevo ensayo de 10 o 30 minutos de llegadas, con 1, 3 o 5 semillas consecutivas desde 2026. La configuración se captura al comenzar: cambios posteriores en los controles no modifican el ensayo en curso. La animación en vivo es independiente.

Los dos controladores reciben cada lote con idéntica llegada, clase, origen y destino. No se heredan fallas ni pedidos peatonales de la sesión. Al finalizar las llegadas, ambas simulaciones continúan hasta completar toda la muestra, con un límite de 60 minutos adicionales. Si queda algún vehículo, no se muestra un ahorro definitivo; las medias de detención siguen siendo acumulaciones parciales.

La detención media mide tiempo a menos de 1,8 km/h y espera fuera de escena, entre todos los vehículos generados. El tiempo medio de recorrido va desde la llegada hasta la salida del tramo. La media entre ensayos se pondera por cantidad de vehículos. El gráfico muestra colas del primer ensayo; la tabla muestra el agregado y el detalle por semilla. El ahorro acumulado suma segundos de todos los vehículos y no equivale a reducción de la duración del ensayo.

La referencia urbana fluida produjo 227 vehículos en tres semillas: el dinámico registró 20,7 s de detención media y el estático 46,7 s, con un ahorro simulado de 26,0 s (55,7%). Ambas muestras terminaron completas. No es una medición de campo ni una ventaja garantizada. Consultar Informe-comparativo.md y comparacion.json para las cifras vigentes.

## Archivos

- live-pair.js: reloj y entradas compartidas para los dos controladores.
- live-view.js: estadísticas y exportación de la comparación visual.
- engine.js: vehículos, trayectorias y controlador de cuatro accesos.
- map.js: huellas edilicias aproximadas al plano de referencia.
- comparison.js: ensayos emparejados y contabilización de la muestra completa.
- baseline.js y comparacion.json: resultado de referencia.
- report.js: presentación de resultados y exportación CSV.
- app.js, index.html y style.css: simulación en vivo e interfaz.
- VAAS-demo.html: versión autónoma para presentar o compartir.

Al editar las piezas, regenerar la versión autónoma. La exportación de sesión y el informe comparativo son independientes.

## Verificación y límites

Se comprobaron 36.000 pasos con tránsito mixto: un único verde, cuatro accesos alternantes, duraciones mínimas, ausencia de habilitación mientras queda ocupación conflictiva, conservación de vehículos y separación en salidas. Se verificaron todas las rutas permitidas y la ausencia de salida hacia 25 de Mayo. Una prueba de verde continuo en cada sentido de San Lorenzo comprobó que los movimientos rectos no se detienen por reservas artificiales. Se verificaron repetibilidad de entradas y resultados, contabilización de ambas muestras, exportaciones y acciones de interfaz con un modelo de documento y canvas.

La revisión visual completa en navegador permanece pendiente por las restricciones de apertura de archivos locales de esta sesión. El prototipo no procesa video, realiza inferencia de IA ni conecta semáforos físicos. No usa datos de campo. Las cifras comparativas son resultados del modelo didáctico y requieren calibración y validación con mediciones reales antes de atribuirlas al cruce de Concordia.

Se verificaron 12.000 pasos compartidos con coincidencia exacta de llegadas, tipos, rutas e identificadores, fases independientes y acciones comunes. Se ejercitaron ambos dibujos y las estadísticas en un modelo de documento/canvas.

El perfil Urbano moderado usa 2 / 6 veh/min (480 veh/h); Equilibrado 4 / 4 y Hora pico 8 / 12. Las demandas elevadas siguen disponibles para probar saturación. Las colas no se limitan artificialmente.

Cada semáforo incorpora un haz azul de visión, visible en ambos paneles. El extremo y la etiqueta muestran el alcance longitudinal supuesto sobre el acceso: 30 m inicialmente, ajustable entre 5 y 90 m desde la sección visible «Alcance de visión de V.A.A.S.» situada sobre las dos simulaciones. Se actualiza también con la reproducción pausada. El abanico representa una zona de observación esquemática. Es una ayuda visual: no modifica los conteos ni representa una cámara calibrada, su óptica u oclusiones por vehículos o edificios.

El perfil Urbano moderado usa 2 / 6 veh/min; Equilibrado 4 / 4 y Hora pico 8 / 12. Las demandas elevadas siguen disponibles para probar saturación. Las colas no se limitan artificialmente.

## Jornada y desglose horario

La sección visible «Tránsito según la hora del día» muestra reloj civil, franja activa y promedio de vehículos/h. La jornada inicial es 06:00–23:00; se editan inicio, fin, horarios de las ocho franjas, caudal entre franjas y reparto por eje. Se aplica y reinicia la comparación con un botón; superposiciones inválidas se rechazan. Inicio y fin iguales representan 24 h; se permite cruzar medianoche. Al concluir, cesan las llegadas y se vacían ambos modelos. Velocidades 60× y 300× permiten una demostración diurna. Las cifras aportadas por el usuario son estimaciones de escenario, sin aforo local verificado. Los picos parten de 1.000 veh/h, los valles de 600, la siesta/noche de 300 y la madrugada de 40; los huecos usan 450.

La sección de ensayo puede evaluar 10 min, 30 min o la jornada completa, usando una copia de la programación aplicada y el mismo flujo para ambos controles. Se exportan los parámetros horarios en el CSV. La referencia anterior de 480 veh/h constantes se mantiene identificada como referencia; no se atribuye su ahorro al escenario horario.

## Gráficos de espera y emisiones

La sección «Espera y emisiones estimadas», situada debajo de ambos cruces, compara la espera media acumulada en un gráfico temporal y el CO₂ por espera en barras. Incluye kg por muestra, g por vehículo y litros consumidos durante la espera. La serie registra puntos cada 15 s simulados; el dibujo conserva el período completo y reduce los puntos visibles si es extenso. Se incluye el último estado en pantalla y en la exportación. Las comparaciones parciales no se presentan como un ahorro definitivo.

Se contabilizan segundos de espera por clase, incluyendo pendientes fuera de escena y conservando los de vehículos que salieron. Fórmula: segundos / 3.600 × L/h al ralentí × fracción con motor encendido × kg CO₂/L. Los cuatro consumos y el porcentaje de motores encendidos son ajustables. Recalcular modifica solo la estimación en vivo de toda la sesión; no altera circulación ni tiempos. Los ensayos conservan una copia de los parámetros. El CSV incluye resultados, supuestos y serie temporal. Los gráficos del informe usan la primera semilla para la evolución y toda la muestra para los totales.

La estimación cubre CO₂ de escape durante la espera, no emisiones totales del viaje ni NOx, CO o partículas. Omite consumo al circular, aceleraciones, arranques en frío y emisiones previas a la combustión. Los valores de consumo son hipótesis didácticas, sin mediciones locales. Factores de combustión de referencia: EPA, https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle .

## Corredor de San Lorenzo

Abrir `corredor.html` desde la misma carpeta. La vista conecta cinco cruces con `corridor.js` y reutiliza las clases, trayectorias y controladores de `engine.js`. `corridor-view.js` presenta las colas y exporta la comparación; `corridor-results.js` carga la corrida de referencia guardada. `index.html` incorpora el acceso «Corredor San Lorenzo».

La secuencia esquemática oeste–este es Alvear, Laprida, 25 de Mayo, Sarmiento y San Luis. Los atributos de inventario se transcribieron de las capturas de la IDE municipal: ID, semáforo, movimientos, cantidad C, ciclo 101 s y gabinetes legibles. No se conoce la definición de los campos ni las fases temporizadas; por eso no se usan para inventar un plan. El control fijo conserva 30 s por acceso del prototipo, con cuatro accesos y transición, ciclo nominal mínimo aproximado de 152 s; no equivale al ciclo municipal informado de 101 s.

Las llegadas siguen el horario anterior: por defecto, el 25% de la demanda total se reparte entre las calles transversales de los cinco cruces y el 75% entra desde los extremos de la avenida. La interfaz también permite repetir el 25% en cada cruce como escenario de estrés. Los vehículos en avenida se encaminan al cruce vecino y mantienen su tipo y velocidad. Las separaciones iniciales son 150 m, estimaciones ajustables hasta obtener coordenadas GIS. Se aproxima una capacidad de almacenamiento por sentido de `(separación − 36 m) / 7,5 m` y el cruce retiene salidas si el tramo vecino se llena. El modelo conserva un carril por sentido, aunque la avenida se ha descrito con tres, y no reproduce la geometría real, distribución de carriles, peatones, estacionamiento, semáforos intermedios o progresión de onda verde.

`comparacion-corredor.json` y `VAAS-corredor-San-Lorenzo.csv` guardan la corrida de 17 h, semilla 2026. Sus métricas describen solo este escenario exploratorio; requieren aforos, velocidades y planes de fase municipales para una comparación operativa.
