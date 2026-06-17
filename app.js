// 1. Configuración de Supabase (¡Reemplaza con tus datos!)
const SUPABASE_URL = 'https://sevzveydrzmtdfpaocsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldnp2ZXlkcnptdGRmcGFvY3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NDIyMDAsImV4cCI6MjA5NzIxODIwMH0.FvWJriHZr3A0xItRu4mxQxjfjg3RVhTBBdFfXpn-Mcg';

const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogos();
    cargarListadoMascotas(); // Carga la tabla al abrir la página
});

// 1. CARGAR TODOS LOS CATÁLOGOS DINÁMICOS
async function cargarCatalogos() {
    await poblarSelect('especies', 'especie_id', 'Seleccione especie');
    await poblarSelect('razas', 'raza_id', 'Seleccione raza');
    await poblarSelect('tipos_atencion', 'tipo_atencion_id', 'Seleccione atención');
    await poblarSelect('condiciones_medicas', 'condicion_medica_id', 'Seleccione condición');
    
    // Poblar también el select del filtro
    await poblarSelect('especies', 'filtro_especie', 'Todas las especies');
}

async function poblarSelect(tabla, elementoId, textoDefault) {
    const select = document.getElementById(elementoId);
    const { data, error } = await clienteSupabase.from(tabla).select('*').order('id');
    
    if (error) return console.error(`Error en ${tabla}:`, error);
    
    let opciones = `<option value="">${textoDefault}</option>`;
    data.forEach(item => opciones += `<option value="${item.id}">${item.nombre}</option>`);
    select.innerHTML = opciones;
}

// 2. FUNCIÓN PARA MOSTRAR MENSAJES
function mostrarMensaje(texto, tipo) {
    const divMensaje = document.getElementById('mensaje');
    divMensaje.textContent = texto;
    divMensaje.className = `mensaje ${tipo}`; 
    setTimeout(() => divMensaje.className = 'mensaje oculto', 4000);
}

// 3. REGISTRAR MASCOTA (POST)
document.getElementById('registroForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnRegistrar');
    btn.disabled = true; btn.textContent = "Registrando...";

    const nuevaMascota = {
        nombre_dueno: document.getElementById('nombre_dueno').value.trim(),
        apellido_dueno: document.getElementById('apellido_dueno').value.trim(),
        dni_dueno: document.getElementById('dni_dueno').value.trim(),
        celular: document.getElementById('celular').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        nombre_mascota: document.getElementById('nombre_mascota').value.trim(),
        edad: parseFloat(document.getElementById('edad').value),
        peso: parseFloat(document.getElementById('peso').value),
        especie_id: parseInt(document.getElementById('especie_id').value),
        raza_id: parseInt(document.getElementById('raza_id').value),
        tipo_atencion_id: parseInt(document.getElementById('tipo_atencion_id').value),
        condicion_medica_id: parseInt(document.getElementById('condicion_medica_id').value),
        observaciones: document.getElementById('observaciones').value.trim()
    };

    const { error } = await clienteSupabase.from('mascotas').insert([nuevaMascota]);

    if (error) {
        mostrarMensaje("Error al registrar. Intente nuevamente.", "error");
    } else {
        mostrarMensaje("¡Mascota registrada exitosamente!", "exito");
        document.getElementById('registroForm').reset();
        cargarListadoMascotas(); // Recarga la lista para ver el nuevo registro
    }

    btn.disabled = false; btn.textContent = "Registrar Paciente";
});

// 4. MOSTRAR LISTADO CON NOMBRES (NO IDs) (GET)
async function cargarListadoMascotas(filtroEspecieId = null) {
    const contenedor = document.getElementById('contenedor_lista');
    
    // Esta consulta es clave: trae los datos de la mascota y los nombres unidos de las otras tablas
    let consulta = clienteSupabase
        .from('mascotas')
        .select(`
            *,
            especies (nombre),
            razas (nombre),
            tipos_atencion (nombre),
            condiciones_medicas (nombre)
        `)
        .order('created_at', { ascending: false });

    // Aplicar filtro si existe
    if (filtroEspecieId) consulta = consulta.eq('especie_id', filtroEspecieId);

    const { data, error } = await consulta;

    if (error) {
        contenedor.innerHTML = '<p style="color: red;">Error al cargar las mascotas.</p>';
        return;
    }

    if (data.length === 0) {
        contenedor.innerHTML = '<p>No hay mascotas registradas con este filtro.</p>';
        return;
    }

    let html = '';
    data.forEach(mascota => {
        html += `
            <div class="tarjeta-mascota">
                <h3>🐾 ${mascota.nombre_mascota} (${mascota.especies.nombre} - ${mascota.razas.nombre})</h3>
                <p><strong>Edad:</strong> ${mascota.edad} | <strong>Peso:</strong> ${mascota.peso} Kg</p>
                <p><strong>Condición:</strong> ${mascota.condiciones_medicas.nombre}</p>
                <p><strong>Atención:</strong> ${mascota.tipos_atencion.nombre}</p>
                <hr style="margin: 10px 0; border: 1px solid #e2e8f0;">
                <p><strong>Dueño:</strong> ${mascota.nombre_dueno} ${mascota.apellido_dueno}</p>
                <p><strong>DNI:</strong> ${mascota.dni_dueno} | <strong>Cel:</strong> ${mascota.celular}</p>
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

// 5. EVENTO DEL FILTRO (Se dispara al cambiar el select)
document.getElementById('filtro_especie').addEventListener('change', function(e) {
    cargarListadoMascotas(e.target.value);
});