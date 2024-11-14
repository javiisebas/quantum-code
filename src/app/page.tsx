import { GameBoard } from './components/GameBoard';
import ModalComponent from './components/ui/Modal';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <GameBoard />
            <ModalComponent />
        </div>
    );
}
