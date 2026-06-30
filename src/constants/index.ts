import { Brain, Target, Zap, Award, TrendingUp, Users, Layers, PenTool, BookOpen } from 'lucide-react';
import { CategoryConfig } from '../types';

export const categories: CategoryConfig[] = [
    { 
      id: 'information-and-ideas',
      name: 'Information and Ideas',
      shortName: 'Info & Ideas',
      icon: Target,
      description: 'Central ideas, details, inferences, claims',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'craft-and-structure',
      name: 'Craft and Structure',
      shortName: 'Craft & Structure',
      icon: Layers,
      description: 'Word choice, text structure, purpose',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      id: 'expression-of-ideas',
      name: 'Expression of Ideas',
      shortName: 'Expression',
      icon: PenTool,
      description: 'Development, organization, effective language',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      id: 'standard-conventions',
      name: 'Standard Conventions',
      shortName: 'Conventions',
      icon: BookOpen,
      description: 'Grammar, punctuation, sentence structure',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];