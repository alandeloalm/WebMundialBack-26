// src/services/emergencias.service.js
// Datos fijos — no requieren BD

const EMERGENCIAS = [
    { nombre: 'Emergencias Generales',          numero: '911',            descripcion: 'Policía, ambulancia y bomberos. Línea principal en México.',     tipo: 'emergencia'    },
    { nombre: 'Cruz Roja Monterrey',             numero: '800 890 3900',   descripcion: 'Ambulancias y urgencias médicas.',                               tipo: 'medico'        },
    { nombre: 'Bomberos Monterrey',              numero: '812 342 0000',   descripcion: 'Cuerpo de Bomberos de Monterrey.',                               tipo: 'bomberos'      },
    { nombre: 'Policía Municipal Monterrey',     numero: '812 040 3000',   descripcion: 'Policía Municipal de Monterrey.',                                tipo: 'policia'       },
    { nombre: 'Fuerza Civil (Policía Estatal)',  numero: '800 822 4000',   descripcion: 'Policía del Estado de Nuevo León.',                              tipo: 'policia'       },
    { nombre: 'Protección Civil NL',             numero: '812 342 0088',   descripcion: 'Desastres naturales, inundaciones, derrumbes.',                  tipo: 'proteccion'    },
    { nombre: 'IMSS Urgencias',                  numero: '800 623 2323',   descripcion: 'Instituto Mexicano del Seguro Social.',                          tipo: 'medico'        },
    { nombre: 'Hospital Universitario UANL',     numero: '812 329 3030',   descripcion: 'Hospital público de tercer nivel. Mitras Centro.',               tipo: 'hospital'      },
    { nombre: 'Hospital Metropolitano',          numero: '818 288 3400',   descripcion: 'Hospital público. Av. Fidel Velázquez.',                         tipo: 'hospital'      },
    { nombre: 'Hospital San José TEC Salud',     numero: '818 347 0900',   descripcion: 'Hospital privado de alta especialidad. Morones Prieto.',         tipo: 'hospital'      },
    { nombre: 'Línea de la Vida',                numero: '800 911 2000',   descripcion: 'Crisis, adicciones o salud mental. 24 horas.',                   tipo: 'salud_mental'  },
    { nombre: 'Consulado EE.UU. Monterrey',      numero: '818 047 3100',   descripcion: 'Para ciudadanos estadounidenses en emergencia.',                 tipo: 'consulado'     },
    { nombre: 'Consulado Canadá Monterrey',      numero: '818 344 3200',   descripcion: 'Para ciudadanos canadienses en emergencia.',                     tipo: 'consulado'     },
    { nombre: 'Grúas y Vialidad NL',             numero: '800 002 6600',   descripcion: 'Asistencia vial y accidentes en carretera.',                     tipo: 'vialidad'      },
  ];
  
  export function getEmergencias() {
    return EMERGENCIAS;
  }
  
  export function getContextoEmergencias() {
    return EMERGENCIAS.map(e => `• ${e.nombre}: ${e.numero} — ${e.descripcion}`).join('\n');
  }