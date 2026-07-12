import { GameState, gameReducer, initialGameState } from '@/contexts/game-state';
import { NoTeamEnum } from '@/enum/no-team.enum';
import { RoleEnum } from '@/enum/role.enum';
import { GameStatusEnum } from '@/enum/game-status.enum';
import { TeamEnum } from '@/enum/team.enum';
import { describe, expect, it } from 'vitest';

// Small handcrafted board (order matters for the index-based assertions):
// 0:RED 1:RED 2:BLUE 3:BLUE 4:NEUTRAL 5:BLACK
const ROLES: RoleEnum[] = [
    TeamEnum.RED,
    TeamEnum.RED,
    TeamEnum.BLUE,
    TeamEnum.BLUE,
    NoTeamEnum.NEUTRAL,
    NoTeamEnum.BLACK,
];

const makeState = (over: Partial<GameState> = {}): GameState => ({
    ...initialGameState,
    status: GameStatusEnum.PLAYING,
    hydrated: true,
    loading: false,
    currentTurn: TeamEnum.RED,
    roles: ROLES,
    revealedRoles: new Array(ROLES.length).fill(false),
    ...over,
});

describe('gameReducer — REVEAL_CARD', () => {
    it('reveals the card and, on your own colour, keeps the turn', () => {
        const next = gameReducer(makeState(), { type: 'REVEAL_CARD', index: 0 }); // RED on RED's turn
        expect(next.revealedRoles[0]).toBe(true);
        expect(next.currentTurn).toBe(TeamEnum.RED);
        expect(next.status).toBe(GameStatusEnum.PLAYING);
    });

    it('passes the turn when a neutral card is revealed', () => {
        const next = gameReducer(makeState(), { type: 'REVEAL_CARD', index: 4 }); // NEUTRAL
        expect(next.currentTurn).toBe(TeamEnum.BLUE);
        expect(next.status).toBe(GameStatusEnum.PLAYING);
    });

    it("passes the turn when the rival's card is revealed", () => {
        const next = gameReducer(makeState(), { type: 'REVEAL_CARD', index: 2 }); // BLUE on RED's turn
        expect(next.revealedRoles[2]).toBe(true);
        expect(next.currentTurn).toBe(TeamEnum.BLUE);
    });

    it('is an instant loss when the assassin is revealed', () => {
        const next = gameReducer(makeState(), { type: 'REVEAL_CARD', index: 5 }); // BLACK
        expect(next.status).toBe(GameStatusEnum.LOST);
    });

    it('wins when a team reveals its last card', () => {
        // RED already has card 0 revealed; revealing card 1 completes RED (2/2).
        const revealed = new Array(ROLES.length).fill(false);
        revealed[0] = true;
        const next = gameReducer(makeState({ revealedRoles: revealed }), {
            type: 'REVEAL_CARD',
            index: 1,
        });
        expect(next.status).toBe(GameStatusEnum.WON);
        expect(next.hasTeamWon).toBe(TeamEnum.RED);
        expect(next.showConfetti).toBe(true);
    });

    it('ignores clicks on already-revealed cards', () => {
        const revealed = new Array(ROLES.length).fill(false);
        revealed[0] = true;
        const state = makeState({ revealedRoles: revealed });
        expect(gameReducer(state, { type: 'REVEAL_CARD', index: 0 })).toBe(state);
    });

    it('ignores clicks once the game is over', () => {
        const state = makeState({ status: GameStatusEnum.LOST });
        expect(gameReducer(state, { type: 'REVEAL_CARD', index: 2 })).toBe(state);
    });
});

describe('gameReducer — PASS_TURN', () => {
    it('toggles the active team while playing', () => {
        const next = gameReducer(makeState({ currentTurn: TeamEnum.RED }), { type: 'PASS_TURN' });
        expect(next.currentTurn).toBe(TeamEnum.BLUE);
    });

    it('is a no-op once the game is over', () => {
        const state = makeState({ status: GameStatusEnum.WON });
        expect(gameReducer(state, { type: 'PASS_TURN' })).toBe(state);
    });
});

describe('gameReducer — REVEAL_ALL / NEW_GAME', () => {
    it('reveals every card and resolves the game', () => {
        const next = gameReducer(makeState(), { type: 'REVEAL_ALL' });
        expect(next.status).toBe(GameStatusEnum.RESOLVED);
        expect(next.revealedRoles.every(Boolean)).toBe(true);
    });

    it('starts a fresh game on the starting team with everything hidden', () => {
        const next = gameReducer(makeState({ status: GameStatusEnum.LOST }), {
            type: 'NEW_GAME',
            code: 123456,
        });
        expect(next.status).toBe(GameStatusEnum.PLAYING);
        expect(next.code).toBe(123456);
        expect(next.currentTurn).toBe(TeamEnum.RED); // STARTING_TEAM
        expect(next.hasTeamWon).toBeNull();
        expect(next.loading).toBe(true);
        expect(next.words).toEqual([]);
        expect(next.roles).toEqual([]);
        expect(next.revealedRoles.every((r) => r === false)).toBe(true);
    });

    it('BOARD_LOADED fills roles + words and clears loading', () => {
        const next = gameReducer(makeState({ loading: true, roles: [], words: [] }), {
            type: 'BOARD_LOADED',
            roles: ROLES,
            words: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis'],
        });
        expect(next.roles).toEqual(ROLES);
        expect(next.words).toHaveLength(ROLES.length);
        expect(next.loading).toBe(false);
        expect(next.error).toBeNull();
    });
});
