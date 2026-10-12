# Comparación de espera y CO₂ por espera

El prototipo calcula el tiempo detenido por clase y lo convierte en consumo al ralentí. Es una estimación de CO₂ del escape durante la espera. No es un aforo ambiental ni representa toda la contaminación del cruce.

**Fórmula:** CO₂ (kg) = espera (s) / 3.600 × consumo (L/h) × motores encendidos (%) / 100 × factor (kg CO₂/L). Se suma por clase de vehículo.

| Clase | Consumo supuesto al ralentí | Combustible supuesto |
| --- | ---: | --- |
| Auto | 0,80 L/h | Nafta |
| Moto | 0,25 L/h | Nafta |
| Colectivo | 2,50 L/h | Diésel |
| Camión | 3,00 L/h | Diésel |

Los consumos son supuestos editables, no valores medidos de la flota de Concordia. Motores encendidos iniciales: 100%.

Los factores de referencia se convierten de galón estadounidense a litro: 8,887 kg CO₂/galón para nafta y 10,180 kg CO₂/galón para diésel, divididos por 3,785411784 L/galón. Fuente: [EPA, emisiones de un vehículo](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle). Como contexto, el consumo al ralentí varía por motor y accesorios: [Departamento de Energía de EE. UU.](https://www.energy.gov/articles/tips-your-tank-summer-driving-season). Estas referencias no constituyen calibración local.

## Referencia de demanda constante

227 vehículos en tres ensayos de diez minutos con 480 veh/h de demanda constante, semillas 2026–2028 y vaciado completo. Esta referencia **no es el resultado de la jornada horaria**. Para obtenerlo, ejecutar el ensayo con la programación deseada.

| Indicador | Dinámico | Estático |
| --- | ---: | ---: |
| Espera media | 20,7 s/veh | 46,7 s/veh |
| CO₂ estimado por espera | 3,164 kg | 7,331 kg |
| CO₂ estimado por espera y vehículo | 13,9 g/veh | 32,3 g/veh |
| Combustible estimado por espera | 1,265 L | 2,930 L |

Diferencia estimada: 4,166 kg (56,8%) menos de CO₂ por espera en el dinámico, para esta muestra y estos supuestos. No garantiza el mismo resultado con otra demanda.

## Alcance y límites

La espera incluye detenciones a menos de 1,8 km/h antes de cruzar y espera de vehículos fuera de escena. Los segundos persisten cuando un vehículo sale. Las estadísticas en vivo son acumuladas y parciales hasta que salgan todos los vehículos. El informe conserva los parámetros con los que se ejecutó.

No se estiman emisiones durante el movimiento, aceleraciones, arranque en frío, mezcla de combustibles local, CO, NOx o partículas. Tampoco se modelan emisiones previas a la combustión ni dispersión atmosférica. Un ajuste del porcentaje de motores encendidos es una hipótesis agregada, no un modelo de sistemas start-stop o flotas eléctricas.
