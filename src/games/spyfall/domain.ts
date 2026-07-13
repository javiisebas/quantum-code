/**
 * Spyfall ("¿Dónde está el espía?") domain.
 *
 * Every player but one is told a shared LOCATION plus a personal ROLE at that place;
 * the remaining player is the spy, who is told only that they are the spy. Players
 * ask each other questions to unmask the spy, while the spy tries to guess the
 * location. Each phone reads its own seat's assignment from the shared payload.
 */

export interface SpyfallLocation {
    name: string;
    roles: string[];
}

/** A published Spyfall room: the location, one role per seat, and the spy's seat. */
export interface SpyfallRoom {
    location: string;
    /** roleBySeat[i] is the role for seat i+1; the spy's entry is ignored. */
    roleBySeat: string[];
    /** 1-based seat that is the spy. */
    spySeat: number;
}

/** Location pool (Spanish). Each has themed roles handed out to non-spy players. */
export const SPYFALL_LOCATIONS: SpyfallLocation[] = [
    {
        name: 'Playa',
        roles: ['Socorrista', 'Surfista', 'Vendedor de helados', 'Turista', 'Pescador'],
    },
    { name: 'Hospital', roles: ['Cirujano', 'Enfermera', 'Paciente', 'Celador', 'Anestesista'] },
    { name: 'Avión', roles: ['Piloto', 'Azafata', 'Polizón', 'Turista', 'Mecánico'] },
    { name: 'Colegio', roles: ['Profesor', 'Alumno', 'Director', 'Conserje', 'Cocinero'] },
    { name: 'Restaurante', roles: ['Chef', 'Camarero', 'Cliente', 'Crítico', 'Lavaplatos'] },
    { name: 'Casino', roles: ['Crupier', 'Apostador', 'Seguridad', 'Camarera', 'Tramposo'] },
    {
        name: 'Estación espacial',
        roles: ['Comandante', 'Ingeniero', 'Médico', 'Astronauta', 'Alienígena'],
    },
    { name: 'Banco', roles: ['Cajero', 'Cliente', 'Guardia', 'Director', 'Atracador'] },
    {
        name: 'Cine',
        roles: ['Acomodador', 'Proyeccionista', 'Espectador', 'Taquillero', 'Crítico'],
    },
    {
        name: 'Estadio',
        roles: ['Futbolista', 'Árbitro', 'Aficionado', 'Entrenador', 'Comentarista'],
    },
    { name: 'Circo', roles: ['Payaso', 'Trapecista', 'Domador', 'Mago', 'Público'] },
    { name: 'Submarino', roles: ['Capitán', 'Sonarista', 'Cocinero', 'Torpedista', 'Grumete'] },
    { name: 'Hotel', roles: ['Recepcionista', 'Botones', 'Huésped', 'Camarera', 'Gerente'] },
    {
        name: 'Universidad',
        roles: ['Catedrático', 'Estudiante', 'Bibliotecaria', 'Decano', 'Bedel'],
    },
    { name: 'Barco pirata', roles: ['Capitán', 'Contramaestre', 'Grumete', 'Vigía', 'Prisionero'] },
];

const shuffle = <T>(items: T[]): T[] => {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const randomInt = (maxExclusive: number): number => Math.floor(Math.random() * maxExclusive);

/**
 * Build a fresh Spyfall room for `count` players: pick a location, deal a role to each
 * seat (cycling the location's role list if there are more seats than roles), and
 * choose one seat to be the spy.
 */
export const buildSpyfall = (count: number): SpyfallRoom => {
    const location = SPYFALL_LOCATIONS[randomInt(SPYFALL_LOCATIONS.length)];
    const roles = shuffle(location.roles);
    const roleBySeat = Array.from({ length: count }, (_, i) => roles[i % roles.length]);
    const spySeat = randomInt(count) + 1; // 1-based
    return { location: location.name, roleBySeat, spySeat };
};

/** All location names, shown to every player so they can reason / accuse. */
export const SPYFALL_LOCATION_NAMES: string[] = SPYFALL_LOCATIONS.map((l) => l.name);

/**
 * The single-seat slice a Spyfall phone is allowed to receive. The spy learns only that
 * they are the spy; every other player gets the shared location plus their own role; a
 * seat beyond the dealt count gets the "table full" marker. No other seat's role — and no
 * hint of who the spy is — is ever present.
 */
export type SpyfallSeatView =
    | { kind: 'spy'; seat: number }
    | { kind: 'player'; seat: number; location: string; role: string }
    | { kind: 'full'; seat: number };

/**
 * Project a Spyfall room down to what `seat` (1-based) may see. Pure and server-side: the
 * `location` reaches only non-spy players and `spySeat` never leaves the server, so the
 * phone can render its card without any other seat's secret.
 */
export const projectSpyfall = (payload: SpyfallRoom, seat: number): SpyfallSeatView => {
    if (seat > payload.roleBySeat.length) return { kind: 'full', seat };
    if (seat === payload.spySeat) return { kind: 'spy', seat };
    return { kind: 'player', seat, location: payload.location, role: payload.roleBySeat[seat - 1] };
};
