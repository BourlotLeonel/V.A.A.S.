# Comparación urbana de V.A.A.S.

La referencia actual utiliza un perfil urbano moderado de 2 vehículos/minuto para Bovino y 25 de Mayo y 6 vehículos/minuto para San Lorenzo. Son totales por eje, repartidos entre ambos accesos: 480 vehículos/h en conjunto. Los valores son ilustrativos, sin conteos de campo.

Se generaron 227 vehículos en tres ensayos de diez minutos. Cada par recibió exactamente las mismas llegadas, clases y rutas. Después se detuvieron las entradas y se completaron ambas muestras.

| Indicador | Estático | Dinámico |
| --- | ---: | ---: |
| Detención media por vehículo | 46,7 s | 20,7 s |
| Recorrido medio por vehículo | 77,6 s | 50,8 s |
| Pendientes después del vaciado | 0 | 0 |

El ahorro ponderado fue 26,0 s por vehículo (55,7%). Las máximas colas por acceso observadas durante las llegadas fueron 6 vehículos en el dinámico y 9 en el estático; no representan un límite impuesto al modelo.

| Semilla | Vehículos | Ahorro de detención por vehículo | Vaciado adicional de ambas muestras |
| --- | ---: | ---: | ---: |
| 2026 | 68 | 35,53 s | 2,0 min |
| 2027 | 80 | 23,08 s | 1,1 min |
| 2028 | 79 | 20,86 s | 1,9 min |

## Cambio de lógica y límites

El dinámico contempla vehículos que se aproximan y pendientes de entrar, asigna verdes entre 8 y 35 segundos y omite accesos sin demanda, conservando el orden circular entre accesos con vehículos. La regla de verde es 8 + 2,4 × vehículos pendientes del acceso, limitada a 35 s; se revisa cada tres segundos después del mínimo. Estos tiempos son ilustrativos para la simulación y requieren validación de ingeniería para un cruce real. El estático mantiene treinta segundos de verde en cada acceso, incluso vacío. Ambos conservan amarillo de cierre, despeje y amarillo previo al verde.

En las tres semillas del perfil actual el ahorro fue positivo, entre 20,9 y 35,5 s por vehículo. La reducción media no garantiza ventajas para toda demanda, distribución de giros o mezcla de vehículos. La simulación permite resultados desfavorables y no elimina vehículos ni recorta colas para favorecer a V.A.A.S. La opción Hora pico incrementa la demanda; si supera la capacidad del cruce, las colas pueden volver a crecer.

La detención suma tiempo a menos de 1,8 km/h y espera fuera de escena, entre todos los vehículos de la muestra completa. Las condiciones en vivo pueden cambiar; su diferencia permanece parcial hasta vaciar ambos modelos. La interfaz conserva exportaciones y el ensayo emparejado independiente.
