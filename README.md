# Calculadora de propagación de errores

Aplicación web estática para resolver problemas de ingeniería mediante aproximación de Taylor de primer orden.

## Qué calcula

Para una función multivariable:

```text
f(x1, x2, ..., xn)
```

usa las cotas de error absoluto de cada variable medida y calcula:

```text
Δf ≈ |∂f/∂x1|Δx1 + |∂f/∂x2|Δx2 + ... + |∂f/∂xn|Δxn
```

Luego informa:

```text
error relativo = Δf / |f|
error porcentual = 100 · error relativo
```

## Casos incluidos

- Geometría aplicada: volumen de esfera, área circular, volumen de cilindro y volumen de cono.
- Circuitos eléctricos: ley de Ohm, potencia `P = V I` y potencia `P = I^2 R`.
- Química y laboratorio: concentración molar y dilución `C2 = C1 V1 / V2`.

## Uso

Abrí `index.html` en un navegador o serví la carpeta con un servidor local. Podés elegir una plantilla como acceso rápido o escribir una función propia con la calculadora científica. Después cargá los valores aproximados y sus cotas `Δ`, y presioná **Calcular propagación**.

Por ejemplo, la plantilla de esfera carga:

```text
d = 3.7 ± 0.05 cm
V = (π/6)d^3
```

La app detecta las variables automáticamente y pide el valor aproximado y la cota de cada una.
