import { 
  CheckCircle2, 
  ChevronDown, 
  ChevronLeft, 
  ChevronUp, 
  Circle, 
  Coffee, 
  Dumbbell, 
  Edit2, 
  List, 
  Minus, 
  Pause, 
  Play, 
  Plus, 
  Save, 
  Search, 
  Settings, 
  SkipForward, 
  Trash2, 
  X,
  ArrowLeft,
  Check,
  LogOut
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';

function interopIcon(icon: any) {
  cssInterop(icon, {
    className: {
      target: 'style',
      nativeStyleToProp: {
        color: true,
        fill: true,
      },
    },
  });
  return icon;
}

export const Icons = {
  CheckCircle2: interopIcon(CheckCircle2),
  ChevronDown: interopIcon(ChevronDown),
  ChevronLeft: interopIcon(ChevronLeft),
  ChevronUp: interopIcon(ChevronUp),
  Circle: interopIcon(Circle),
  Coffee: interopIcon(Coffee),
  Dumbbell: interopIcon(Dumbbell),
  Edit2: interopIcon(Edit2),
  List: interopIcon(List),
  Minus: interopIcon(Minus),
  Pause: interopIcon(Pause),
  Play: interopIcon(Play),
  Plus: interopIcon(Plus),
  Save: interopIcon(Save),
  Search: interopIcon(Search),
  Settings: interopIcon(Settings),
  SkipForward: interopIcon(SkipForward),
  Trash2: interopIcon(Trash2),
  X: interopIcon(X),
  ArrowLeft: interopIcon(ArrowLeft),
  Check: interopIcon(Check),
  LogOut: interopIcon(LogOut),
};
