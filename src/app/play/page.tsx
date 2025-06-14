import { GameBoard } from './components/GameBoard';

export default function PlayPage() {
    return (
        <div className="relative flex items-center justify-center w-full h-screen overflow-hidden">
            <GameBoard />
        </div>
    );
}
