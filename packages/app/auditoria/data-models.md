# Modelos de Datos

Los tipos se deducen del código fuente (JavaScript sin TypeScript). Los nombres de campo provienen directamente de los literales de objeto construidos en los componentes y de los accesos a propiedades en los renders.

---

## Sala

Devuelto por `GET api/salas` y `GET api/salas/:id`.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `idSala` | `number` | PK. Usado en comparaciones (`===`). |
| `nombreSala` | `string` | Nombre visible. Unicidad validada en cliente (case-insensitive). |

Ejemplo construido internamente (nunca enviado; el nombre va en la URL):
```js
// No hay body en postSala ni putSala — los datos van en la URL
```

Relaciones:
- Una `Sala` puede tener muchos `TES` (asignaciones empresa-timer).

---

## Empresa

Devuelto por `GET api/empresas` y `GET api/empresas/:id`.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `idEmpresa` | `number` | PK. |
| `nombreEmpresa` | `string` | Nombre visible. Unicidad validada en cliente (case-insensitive). |

Relaciones:
- Una `Empresa` puede tener muchos `TES`.
- Aparece referenciada desde `EventoActual` a través del campo `empresa` (string, no ID).

---

## Categoria

Devuelto por `GET api/categoriastimer` y `GET api/categoriastimer/:id`.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `idCategoria` | `number` | PK. |
| `categoria` | `string` | Nombre de la categoría. Unicidad validada en cliente (case-insensitive). |
| `duracion` | `number` | Duración en minutos (entero). Convertido desde/hacia formato `HH:mm` en cliente. |

Body enviado en POST:
```js
{
  idCategoria: 0,       // 0 para creación
  categoria: string,
  duracion: number      // minutos enteros
}
```

Body enviado en PUT:
```js
{
  idCategoria: number,  // ID existente
  categoria: string,
  duracion: number
}
```

Relaciones:
- Una `Categoria` puede estar asignada a muchos `Temporizador`.

---

## Temporizador (Timer)

Devuelto por `GET api/timers`.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `idTemporizador` | `number` | PK. |
| `inicio` | `string` | Datetime en formato ISO 8601: `"YYYY-MM-DDTHH:mm:ss"`. Ejemplo: `"2024-06-01T10:30:00"`. |
| `idCategoria` | `number` o `string` | FK a `Categoria`. Atención: en el body de POST/PUT se envía como string (viene de un `<select>` HTML). El backend debe coercionar. |
| `pausa` | `boolean` | Indica si el temporizador está en pausa. Siempre se envía como `false` desde el cliente. |

Body enviado en POST (nuevo timer):
```js
{
  idTemporizador: 0,
  inicio: "YYYY-MM-DDTHH:mm:ss",   // date + "T" + time + ":00"
  idCategoria: string,              // valor de <select>, cast implícito
  pausa: false
}
```

Body enviado en PUT (modificar timer):
```js
{
  idTemporizador: number,           // ID existente
  inicio: "YYYY-MM-DDTHH:mm:ss",
  idCategoria: string,
  pausa: false
}
```

Relaciones:
- Un `Temporizador` pertenece a una `Categoria`.
- Un `Temporizador` puede tener muchos `TES`.

---

## TiempoEmpresaSala (TES)

Entidad pivote. Devuelto por `GET api/TiempoEmpresaSala`.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `id` | `number` | PK. Usado para el DELETE. |
| `idTimer` | `number` | FK a `Temporizador.idTemporizador`. |
| `idEmpresa` | `number` | FK a `Empresa.idEmpresa`. |
| `idSala` | `number` | FK a `Sala.idSala`. |
| `idEvento` | `number` | Siempre `1` en el código cliente. Probablemente un campo de agrupación de evento. |

Body enviado en POST:
```js
{
  id: 0,
  idTimer: number,
  idEmpresa: number,    // Number.parseInt() aplicado sobre el valor del <select>
  idSala: number,
  idEvento: 1
}
```

Restricción de unicidad implícita: el cliente valida que no exista ya una combinación `(idTimer, idSala)` antes de crear una nueva. No hay endpoint PUT; la actualización requiere DELETE + POST.

---

## EventoActual (proyección de TimerEvento)

Devuelto por `GET api/timereventos/eventosactualesempresa/:id` y `GET api/timereventos/eventosempresa/:id`. Esta es una proyección del backend, no una entidad almacenada directamente.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `empresa` | `string` | Nombre de la empresa (desnormalizado). |
| `sala` | `string` | Nombre de la sala (desnormalizado). |
| `inicioTimer` | `string` | Datetime ISO 8601. Mismo formato que `Temporizador.inicio`. |
| `idCategoria` | `number` | FK a `Categoria`. Usado en `EmpresasEventoTimers` para calcular el fin. |
| `duracion` | `number` | Duración en minutos. Usado directamente en `HorarioActualEmpresaPopUp` sin pasar por `idCategoria`. |
| `imagenEmpresa` | `string` | URL de imagen de la empresa. Usado en `EmpresasEventoTimersNew.showEventsMessage`. |

Nota: existe inconsistencia entre los dos componentes que consumen este endpoint:
- `EmpresasEventoTimers` usa `idCategoria` para calcular el fin (pero `this.state.categorias` nunca se carga en ese componente, por lo que `getFinal` siempre devuelve `""`).
- `HorarioActualEmpresaPopUp` usa `duracion` directamente, lo que es correcto.

---

## Empresa (versión del endpoint empresastimers)

Devuelto por `GET api/timereventos/empresastimers`. Parece ser la misma forma que `Empresa` estándar pero filtrada a las que tienen timers asignados.

| Campo | Tipo inferido | Notas |
|---|---|---|
| `idEmpresa` | `number` | PK. Usado como `key` en el render. |
| `nombreEmpresa` | `string` | Nombre visible. |

---

## Diagrama de relaciones

```
Sala (idSala, nombreSala)
  |
  | 1:N
  v
TES (id, idTimer, idEmpresa, idSala, idEvento)
  |                    |
  | N:1                | N:1
  v                    v
Temporizador       Empresa
(idTemporizador,   (idEmpresa,
 inicio,            nombreEmpresa)
 idCategoria,
 pausa)
  |
  | N:1
  v
Categoria
(idCategoria,
 categoria,
 duracion)
```

La tabla `TimerEvento` / `timereventos` es una proyección de vista del backend que cruza las tablas anteriores. El cliente nunca escribe en ella directamente.
