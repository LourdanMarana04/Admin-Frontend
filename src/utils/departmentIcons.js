import { 
  Building,
  DollarSign,
  FileCheck,
  Shield,
  Heart,
  Briefcase,
  GraduationCap,
  Car,
  Home,
  Wrench,
  Clipboard,
  Scale,
  Landmark,
  UserCheck,
  FileX,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Globe,
  Camera,
  Music,
  BookOpen,
  Stethoscope,
  Utensils,
  TreePine,
  Zap,
  Lightbulb,
  Target,
  Award,
  Star,
  Crown,
  Gavel,
  Hammer,
  Settings,
  Database,
  Server,
  Network,
  Lock,
  Key,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Save,
  Upload,
  Printer,
  Copy,
  RefreshCw,
  Maximize,
  Minimize,
  X,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Link,
  Share,
  MessageCircle,
  Bell,
  Volume2,
  VolumeX,
  Play,
  Pause,
  File,
  Folder,
  Archive,
  Inbox,
  Send,
  Reply,
  Forward,
  Flag,
  Bookmark,
  Tag,
  Tags,
  Hash,
  AtSign,
  Percent,
  PlusCircle,
  MinusCircle,
  CheckCircle,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Diamond,
  Moon,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Flame,
  Snowflake,
  Umbrella,
  Sunrise,
  Sunset,
  Compass,
  Map,
  Navigation,
  Route,
  Earth,
  Mountain,
  Waves,
  Trees,
  Leaf,
  Flower,
  Calculator,
  TrendingUp,
  Users,
  Monitor
} from 'lucide-react';

// Function to get appropriate icon for department
export const getDepartmentIcon = (departmentName) => {
  // Safety check for undefined, null, or empty values
  if (!departmentName || typeof departmentName !== 'string') {
    return Building;
  }
  
  const name = departmentName.toLowerCase();
  
  // Government & Administration
  if (name.includes('mayor') || name.includes('city mayor')) return Crown;
  if (name.includes('administrator') || name.includes('administration')) return Building;
  if (name.includes('coordinator') || name.includes('planning')) return Map;
  if (name.includes('development')) return TrendingUp;
  
  // Financial & Treasury
  if (name.includes('treasury') || name.includes('finance') || name.includes('financial')) return DollarSign;
  if (name.includes('assessor') || name.includes('assessment')) return Calculator;
  if (name.includes('tax') || name.includes('revenue')) return CreditCard;
  
  // Legal & Justice
  if (name.includes('legal') || name.includes('law') || name.includes('attorney')) return Scale;
  if (name.includes('court') || name.includes('judge')) return Gavel;
  
  // Health & Social Services
  if (name.includes('health') || name.includes('medical') || name.includes('hospital')) return Stethoscope;
  if (name.includes('social') || name.includes('welfare')) return Heart;
  if (name.includes('senior') || name.includes('elderly')) return Users;
  
  // Education
  if (name.includes('education') || name.includes('school') || name.includes('university')) return GraduationCap;
  if (name.includes('library')) return BookOpen;
  
  // Public Safety
  if (name.includes('police') || name.includes('security') || name.includes('safety')) return Shield;
  if (name.includes('fire') || name.includes('emergency')) return Flame;
  
  // Infrastructure & Public Works
  if (name.includes('public works') || name.includes('infrastructure')) return Wrench;
  if (name.includes('engineering') || name.includes('engineer')) return Settings;
  if (name.includes('utilities') || name.includes('water') || name.includes('electric')) return Zap;
  
  // Environment & Natural Resources
  if (name.includes('environment') || name.includes('environmental')) return Leaf;
  if (name.includes('parks') || name.includes('recreation')) return TreePine;
  if (name.includes('sanitation') || name.includes('sanitary')) return Droplets;
  
  // Business & Economic Development
  if (name.includes('business') || name.includes('economic') || name.includes('commerce')) return Briefcase;
  if (name.includes('permit') || name.includes('licensing')) return FileCheck;
  
  // Information & Technology
  if (name.includes('information') || name.includes('it') || name.includes('technology')) return Monitor;
  if (name.includes('data') || name.includes('database')) return Database;
  
  // Human Resources
  if (name.includes('human resources') || name.includes('hr') || name.includes('personnel')) return UserCheck;
  
  // General Services
  if (name.includes('general services') || name.includes('maintenance')) return Hammer;
  if (name.includes('facilities') || name.includes('building')) return Home;
  
  // Transportation
  if (name.includes('transportation') || name.includes('traffic') || name.includes('vehicle')) return Car;
  
  // Communication
  if (name.includes('communication') || name.includes('media') || name.includes('press')) return MessageCircle;
  
  // Planning & Zoning
  if (name.includes('planning') || name.includes('zoning')) return MapPin;
  
  // Default fallback
  return Building;
};
