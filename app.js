// 1. Configuración de Supabase (¡Reemplaza con tus datos!)
const SUPABASE_URL = 'https://sevzveydrzmtdfpaocsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldnp2ZXlkcnptdGRmcGFvY3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDIyMDAsImV4cCI6MjA5NzIxODIwMH0.FvWJriHZr3A0xItRu4mxQxjfjg3RVhTBBdFfXpn-Mcg';

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Ejecutar funciones al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    cargarGradosAcademicos();
    cargarEnfermedades();
});

// 3. Funciones para cargar catálogos dinámicamente
async function cargarGradosAcademicos() {
    const select = document.getElementById('grado_academico_id');
    const { data, error } = await clienteSupabase.from('grados_academicos').select('*').eq('activo', true).order('id', { ascending: true });
    
    if (error) {
        console.error("Error al cargar grados:", error);
        select.innerHTML = '<option value="">Error al cargar datos</option>';
        return;
    }
    
    select.innerHTML = '<option value="">Seleccione un grado...</option>';
    data.forEach(grado => {
        select.innerHTML += `<option value="${grado.id}">${grado.nombre}</option>`;
    });
}

async function cargarEnfermedades() {
    const select = document.getElementById('enfermedad_preexistente_id');
    const { data, error } = await clienteSupabase.from('enfermedades_preexistentes').select('*').eq('activo', true).order('id', { ascending: true });
    
    if (error) {
        console.error("Error al cargar enfermedades:", error);
        select.innerHTML = '<option value="">Error al cargar datos</option>';
        return;
    }

    select.innerHTML = '<option value="">Seleccione una enfermedad...</option>';
    data.forEach(enfermedad => {
        select.innerHTML += `<option value="${enfermedad.id}">${enfermedad.nombre}</option>`;
    });
}

// 4. LÓGICA DE INTERFAZ Y VALIDACIONES

// A. Cálculo automático de la edad
document.getElementById('fecha_nacimiento').addEventListener('change', function(e) {
    const fechaNacimiento = new Date(e.target.value);
    const hoy = new Date();
    
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
    }
    
    document.getElementById('edad').value = edad;
});

// B. Controlar el campo de Tipo de Seguro
const checkboxSeguro = document.getElementById('cuenta_seguro');
const inputTipoSeguro = document.getElementById('tipo_seguro');

checkboxSeguro.addEventListener('change', function() {
    if (this.checked) {
        inputTipoSeguro.disabled = false;
        inputTipoSeguro.focus();
    } else {
        inputTipoSeguro.disabled = true;
        inputTipoSeguro.value = '';
    }
});

// C. Validación del campo Distrito (No permitir SOLO números)
const inputDistrito = document.getElementById('distrito');

inputDistrito.addEventListener('input', function() {
    if (/^\d+$/.test(this.value)) {
        this.setCustomValidity('El distrito no puede ser solo números. Ingrese texto.');
    } else {
        this.setCustomValidity(''); 
    }
});

// 5. Función para mostrar mensajes en pantalla
function mostrarMensaje(texto, tipo) {
    const divMensaje = document.getElementById('mensaje');
    divMensaje.textContent = texto;
    divMensaje.className = `mensaje ${tipo}`; 
    
    setTimeout(() => {
        divMensaje.className = 'mensaje oculto';
    }, 5000);
}

// 6. EVENTO DE ENVÍO DEL FORMULARIO
document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault(); 

    const btnRegistrar = document.getElementById('btnRegistrar');
    btnRegistrar.disabled = true;
    btnRegistrar.textContent = "Registrando...";

    const pacienteData = {
        nombres: document.getElementById('nombres').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        dni: document.getElementById('dni').value.trim(),
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
        edad: parseInt(document.getElementById('edad').value),
        sexo: document.getElementById('sexo').value,
        celular: document.getElementById('celular').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        distrito: document.getElementById('distrito').value.trim(),
        estado_civil: document.getElementById('estado_civil').value,
        grado_academico_id: parseInt(document.getElementById('grado_academico_id').value),
        enfermedad_preexistente_id: parseInt(document.getElementById('enfermedad_preexistente_id').value),
        cuenta_seguro: document.getElementById('cuenta_seguro').checked,
        tipo_seguro: document.getElementById('tipo_seguro').value.trim(),
        observaciones: document.getElementById('observaciones').value.trim()
    };

    // Validación contra la base de datos (DNI o Nombres+Apellidos)
    const { data: pacienteExistente, error: errorBusqueda } = await clienteSupabase
        .from('pacientes')
        .select('id, dni, nombres, apellidos')
        .or(`dni.eq.${pacienteData.dni},and(nombres.eq."${pacienteData.nombres}",apellidos.eq."${pacienteData.apellidos}")`);

    if (errorBusqueda) {
        mostrarMensaje("Error al verificar registros previos.", "error");
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = "Registrar Paciente";
        return;
    }

    if (pacienteExistente && pacienteExistente.length > 0) {
        mostrarMensaje("Usuario ya registrado", "error");
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = "Registrar Paciente";
        return;
    }

    // Inserción final en la base de datos
    const { error: errorInsert } = await clienteSupabase
        .from('pacientes')
        .insert([pacienteData]);

    if (errorInsert) {
        console.error(errorInsert);
        mostrarMensaje("No se pudo registrar el paciente. Verifique los datos ingresados.", "error");
    } else {
        mostrarMensaje("Paciente registrado correctamente", "exito");
        document.getElementById('registroForm').reset(); 
        document.getElementById('edad').value = ''; 
        inputTipoSeguro.disabled = true; // Volver a bloquear el seguro tras limpiar
    }

    btnRegistrar.disabled = false;
    btnRegistrar.textContent = "Registrar Paciente";
});