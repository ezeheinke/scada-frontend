# Objetivo
El objetivo de este módulo es mostrar cuando hay eventos que son importantes que vea el operador

# Funcionalidades
A nivel gráfico tendrá un marcador, que mostrará el número de eventos activos.
El número de eventos activos se lee de la señal: __MOD.EventChecker.ActiveNotAckEvents__, en ella se escribe un objeto json con los eventos actualmente activos en el sistema, el json es como el siguiente:

```
[
    {
        "CScadaEventId":10152,
        "Source":"PE CabezoDeSanRoque","Type":"SETPOINT",
        "SubType":"sound1",
        "StartDate":"/Date(1468184055551)/","EndDate":"null",
        "Text":"Setpoint 0 kW received from CECORE with motive 2"
    }
]
```

En este objeto si el sutipo contiene la cadena sound, hay que reproducir el sonido adecuado.

Desde el notificador tambien se pueden reconocer eventos, para reconocer eventos hay que escribir en la señal 

```
[
    {
        "EventId":10152,
        "AcknowledgeUser":"OperatorWEB","AcknowledgeMessage":"Acknowledged without comments"
    }
]
```

Con el id del evento que queremos reconocer