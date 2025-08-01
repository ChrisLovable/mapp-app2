import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdAdd, MdEdit, MdDelete, MdCheck, MdSchedule, MdFlag, MdLabel, MdNotes, MdCalendarToday, MdToday, MdDateRange, MdKeyboardArrowUp, MdKeyboardArrowDown, MdRemove } from 'react-icons/md';
import { supabase } from '../lib/supabase';
import { alarmManager, getAlarmTimeFromText } from '../lib/AlarmLogic';
import { useAuth } from '../contexts/AuthContext';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInput?: string;
}

interface Todo {
  id: string;
  title: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  project?: string;
  completed: boolean;
  created_at: string;
}

interface ParsedTodo {
  title: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  project?: string;
}

interface EditableTask {
  id: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  reminder_time: string;
  project: string;
}

export default function TodoModal({ isOpen, onClose, initialInput }: TodoModalProps) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [parsedTasks, setParsedTasks] = useState<EditableTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setParsedTasks([]);
      setEditingTodo(null);
      setError('');
      setDebugInfo('');
    } else {
      fetchTodos();
    }
  }, [isOpen]);

  // Auto-parse input when modal opens with initial input
  useEffect(() => {
    if (isOpen && initialInput && initialInput.trim()) {
      setInput(initialInput);
      parseInputForDisplay(initialInput);
    } else if (isOpen) {
      // Clear any existing parsed tasks when opening without input
      setParsedTasks([]);
      setInput('');
    }
  }, [isOpen, initialInput]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching todos:', error);
        setError('Failed to load todos');
        return;
      }

      setTodos(data || []);
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to load todos');
    } finally {
      setIsLoading(false);
    }
  };

  const parseInputForDisplay = async (input: string) => {
    if (!input.trim()) return;

    setIsParsing(true);
    setError('');

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env file.');
      }

      const currentDate = new Date().toISOString().split('T')[0];
      const prompt = `You are an intelligent task parser. Given natural language input, extract distinct to-do items, associating each with its own specific date, time, and context if provided.

Instructions:

Identify each action and assign it to a separate task block.

If multiple dates/times are mentioned, match them to the closest preceding action only.

For phrases like "in 2 weeks", "tomorrow at 8", or "next Monday", calculate and assign actual deadline and reminder values.

Clean up filler words like "uh", "you know", "like", etc.

Assign default priority: high unless user clearly states otherwise.

Try to guess project based on task content, e.g. "Go to the dentist" → project: Health

Current date: ${currentDate}

Input: "${input}"

Return tasks in a structured array with:
- description
- deadline (yyyy-mm-dd)
- reminder_time (HH:mm)
- priority
- project

Example output:
[
  {
    "description": "Go to the dentist.",
    "deadline": "2025-08-02",
    "reminder_time": "08:00",
    "priority": "high",
    "project": "Health"
  },
  {
    "description": "Pick up the kids from school.",
    "deadline": "2025-07-20",
    "reminder_time": "08:00",
    "priority": "high",
    "project": "Family"
  }
]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent task parser. Given natural language input, extract distinct to-do items, associating each with its own specific date, time, and context if provided. Always return valid JSON arrays.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response received from OpenAI');
      }

      try {
        const parsed = JSON.parse(content);
        const tasks = Array.isArray(parsed) ? parsed : [parsed];
        
        // Convert to editable task objects with proper formatting and hardcoded date parsing
        const editableTasks: EditableTask[] = tasks.map((task, index) => {
          // Use hardcoded date parsing for the original input
          const parsedDate = parseDateFromText(input);
          
          return {
            id: `task-${index}`,
            description: formatDescription(task.title || task.description || ''),
            deadline: parsedDate.date || task.due_date || task.deadline || '',
            priority: task.priority || 'high',
            reminder_time: parsedDate.time || task.reminder_time || '',
            project: formatProject(task.project || '')
          };
        });
        
        // Set debug info to show what was parsed
        const parsedDate = parseDateFromText(input);
        setDebugInfo(`Input: "${input}" | Parsed Date: ${parsedDate.date} | Parsed Time: ${parsedDate.time || 'none'} | Current: ${new Date().toISOString().split('T')[0]}`);
        
        setParsedTasks(editableTasks);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        setParsedTasks([]);
      }
          } catch (error) {
        console.error('Error parsing input:', error);
        setError(`Failed to parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setParsedTasks([]);
      } finally {
        setIsParsing(false);
      }
    };

  const parseTodoWithAI = async (input: string): Promise<ParsedTodo> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env file.');
    }

    const prompt = `
Parse the following task input into a structured format:
- Extract the task title (required)
- If there's a deadline or date, extract it (ISO format: YYYY-MM-DD)
- Detect if there is a priority (low/medium/high) - if not specified, use 'medium'
- Extract additional notes if mentioned
- Extract a project or label if included

Return ONLY a valid JSON object with these fields: title, due_date, priority, notes, project

Input: "${input}"

Example output format:
{
  "title": "Buy milk",
  "due_date": "2024-01-15",
  "priority": "high",
  "notes": "Need for breakfast tomorrow",
  "project": "Shopping"
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that structures to-do items from natural language text. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response received from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || input,
        due_date: parsed.due_date,
        priority: parsed.priority || 'medium',
        notes: parsed.notes,
        project: parsed.project
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: create a basic todo
      return {
        title: input,
        priority: 'medium'
      };
    }
  };

  const saveTodo = async (parsedTodo: ParsedTodo) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          ...parsedTodo,
          completed: false,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setTodos([data, ...todos]);
      setInput('');
      return data;
    } catch (error) {
      console.error('Error saving todo:', error);
      throw error;
    }
  };

  const handleAddTodo = async () => {
    if (!input.trim()) return;

    setIsParsing(true);
    setError('');

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env file.');
      }

      const prompt = `
Parse the following input and extract multiple tasks/actions. For each task, identify:
- Description (what needs to be done)
- Deadline (if mentioned, in YYYY-MM-DD format)
- Priority (low/medium/high - if not specified, use 'medium')
- Reminder time (if mentioned, in HH:MM format)
- Project/label (if mentioned)

Return ONLY a valid JSON array with objects containing: description, deadline, priority, reminder_time, project

Input: "${input}"

Example output format:
[
  {
    "description": "Buy groceries",
    "deadline": "2024-01-15",
    "priority": "high",
    "reminder_time": "17:00",
    "project": "Shopping"
  },
  {
    "description": "Call dentist",
    "deadline": "2024-01-20",
    "priority": "medium",
    "reminder_time": null,
    "project": "Health"
  }
]
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent task parser. Given natural language input, extract distinct to-do items, associating each with its own specific date, time, and context if provided. Always return valid JSON arrays.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response received from OpenAI');
      }

      try {
        const parsed = JSON.parse(content);
        const tasks = Array.isArray(parsed) ? parsed : [parsed];
        
        // Save each task to the database
        for (const task of parsedTasks) {
          const todoData = {
            title: task.description,
            due_date: task.deadline || undefined,
            priority: task.priority,
            notes: task.reminder_time ? (() => {
              // Convert HH:MM format to 00h00 format
              const [hours, minutes] = task.reminder_time.split(':');
              const formattedTime = `${hours}h${minutes}`;
              return `Reminder: ${formattedTime}`;
            })() : undefined,
            project: task.project || undefined
          };
          await saveTodo(todoData);
        }
        
        setInput('');
        setParsedTasks([]);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        throw new Error('Failed to parse tasks. Please try again.');
      }
    } catch (error) {
      console.error('Error adding todos:', error);
      setError(`Failed to add todos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateTodo = async (todo: Todo) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update(todo)
        .eq('id', todo.id);

      if (error) {
        throw new Error(error.message);
      }

      setTodos(todos.map(t => t.id === todo.id ? todo : t));
      setEditingTodo(null);
    } catch (error) {
      console.error('Error updating todo:', error);
      setError(`Failed to update todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      setTodos(todos.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      setError(`Failed to delete todo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    try {
      // Update the task as completed in the database
      const { error } = await supabase
        .from('todos')
        .update({ completed: true })
        .eq('id', todo.id);

      if (error) {
        console.error('Error marking task as completed:', error);
        setError('Failed to mark task as completed');
        return;
      }

      // Remove the task from the saved tasks list
      setTodos(prev => prev.filter(t => t.id !== todo.id));
      
      console.log('Task marked as completed and removed from list:', todo.title);
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task');
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return { text: 'Today', icon: <MdToday className="text-orange-500" /> };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', icon: <MdToday className="text-blue-500" /> };
    } else {
      // Format: "weekday, Dd, month, yyyy" (e.g., "Monday, 15 Jan, 2024")
      const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      return { 
        text: `${weekday}, ${day} ${month}, ${year}`, 
        icon: <MdDateRange className="text-gray-500" /> 
      };
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <MdKeyboardArrowUp className="text-red-500" />;
      case 'medium':
        return <MdRemove className="text-yellow-500" />;
      case 'low':
        return <MdKeyboardArrowDown className="text-green-500" />;
      default:
        return <MdRemove className="text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (projectFilter !== 'all' && todo.project !== projectFilter) return false;
    return true;
  });

  const projects = [...new Set(todos.map(t => t.project).filter(Boolean))];

  const updateParsedTask = (id: string, field: keyof EditableTask, value: string) => {
    setParsedTasks(prev => prev.map(task => 
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const removeParsedTask = (id: string) => {
    setParsedTasks(prev => prev.filter(task => task.id !== id));
  };

  const formatDescription = (description: string): string => {
    if (!description) return '';
    
    // Clean up the description
    let formatted = description.trim();
    
    // Remove common filler words at the beginning
    formatted = formatted.replace(/^(i need to|i have to|i want to|i should|i must|i gotta|i got to)\s+/i, '');
    
    // Capitalize first letter
    formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    
    // Ensure it ends with proper punctuation
    if (!formatted.endsWith('.') && !formatted.endsWith('!') && !formatted.endsWith('?')) {
      formatted += '.';
    }
    
    // Clean up multiple spaces
    formatted = formatted.replace(/\s+/g, ' ');
    
    return formatted;
  };

  const formatProject = (project: string): string => {
    if (!project) return '';
    
    // Clean up the project name
    let formatted = project.trim();
    
    // Capitalize first letter of each word
    formatted = formatted.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    // Remove unnecessary words
    formatted = formatted.replace(/\b(for|in|the|project|category)\b/gi, '').trim();
    
    // Clean up multiple spaces
    formatted = formatted.replace(/\s+/g, ' ');
    
    return formatted;
  };

  // Hardcoded date parsing functions
  const parseDateFromText = (text: string): { date: string; time: string } => {
    const lowerText = text.toLowerCase();
    const today = new Date();
    let targetDate = new Date(today);
    let time = '';

    // Date parsing
    if (lowerText.includes('today')) {
      targetDate = new Date(today);
    } else if (lowerText.includes('tomorrow')) {
      targetDate.setDate(today.getDate() + 1);
    } else if (lowerText.includes('yesterday')) {
      targetDate.setDate(today.getDate() - 1);
    } else if (lowerText.includes('day after tomorrow')) {
      targetDate.setDate(today.getDate() + 2);
    } else if (lowerText.includes('next week')) {
      targetDate.setDate(today.getDate() + 7);
    } else if (lowerText.includes('next month')) {
      targetDate.setMonth(today.getMonth() + 1);
    } else if (lowerText.includes('this week')) {
      // Get Monday of current week
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      targetDate.setDate(today.getDate() - daysToMonday);
    } else if (lowerText.includes('this weekend')) {
      // Get next Saturday
      const dayOfWeek = today.getDay();
      const daysToSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek;
      targetDate.setDate(today.getDate() + daysToSaturday);
    } else if (lowerText.includes('next weekend')) {
      // Get Saturday of next week
      const dayOfWeek = today.getDay();
      const daysToNextSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek + 7;
      targetDate.setDate(today.getDate() + daysToNextSaturday);
    } else if (lowerText.includes('in 2 days')) {
      targetDate.setDate(today.getDate() + 2);
    } else if (lowerText.includes('in 3 days')) {
      targetDate.setDate(today.getDate() + 3);
    } else if (lowerText.includes('in a week') || lowerText.includes('in 1 week')) {
      targetDate.setDate(today.getDate() + 7);
    } else if (lowerText.includes('in 2 weeks')) {
      targetDate.setDate(today.getDate() + 14);
    } else if (lowerText.includes('in a month') || lowerText.includes('in 1 month')) {
      targetDate.setMonth(today.getMonth() + 1);
    } else if (lowerText.includes('on monday') || lowerText.includes('next monday')) {
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 1 ? 7 : (1 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToMonday);
    } else if (lowerText.includes('on tuesday') || lowerText.includes('next tuesday')) {
      const dayOfWeek = today.getDay();
      const daysToTuesday = dayOfWeek === 2 ? 7 : (2 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToTuesday);
    } else if (lowerText.includes('on wednesday') || lowerText.includes('next wednesday')) {
      const dayOfWeek = today.getDay();
      const daysToWednesday = dayOfWeek === 3 ? 7 : (3 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToWednesday);
    } else if (lowerText.includes('on thursday') || lowerText.includes('next thursday')) {
      const dayOfWeek = today.getDay();
      const daysToThursday = dayOfWeek === 4 ? 7 : (4 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToThursday);
    } else if (lowerText.includes('on friday') || lowerText.includes('next friday')) {
      const dayOfWeek = today.getDay();
      const daysToFriday = dayOfWeek === 5 ? 7 : (5 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToFriday);
    } else if (lowerText.includes('on saturday') || lowerText.includes('next saturday')) {
      const dayOfWeek = today.getDay();
      const daysToSaturday = dayOfWeek === 6 ? 7 : (6 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToSaturday);
    } else if (lowerText.includes('on sunday') || lowerText.includes('next sunday')) {
      const dayOfWeek = today.getDay();
      const daysToSunday = dayOfWeek === 0 ? 7 : (0 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToSunday);
    } else if (lowerText.includes('this monday')) {
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 1 ? 0 : (1 - dayOfWeek + 7) % 7;
      targetDate.setDate(today.getDate() + daysToMonday);
    }

    // Time parsing
    if (lowerText.includes('at 8am') || lowerText.includes('at 8 am')) {
      time = '08:00';
    } else if (lowerText.includes('at 8pm') || lowerText.includes('at 8 pm')) {
      time = '20:00';
    } else if (lowerText.includes('at 8')) {
      time = '08:00'; // Default to AM
    } else if (lowerText.includes('at 9am') || lowerText.includes('at 9 am')) {
      time = '09:00';
    } else if (lowerText.includes('at 9pm') || lowerText.includes('at 9 pm')) {
      time = '20:00';
    } else if (lowerText.includes('at 9')) {
      time = '09:00';
    } else if (lowerText.includes('at 10am') || lowerText.includes('at 10 am')) {
      time = '10:00';
    } else if (lowerText.includes('at 10pm') || lowerText.includes('at 10 pm')) {
      time = '22:00';
    } else if (lowerText.includes('at 10')) {
      time = '10:00';
    } else if (lowerText.includes('at 11am') || lowerText.includes('at 11 am')) {
      time = '11:00';
    } else if (lowerText.includes('at 11pm') || lowerText.includes('at 11 pm')) {
      time = '23:00';
    } else if (lowerText.includes('at 11')) {
      time = '11:00';
    } else if (lowerText.includes('at 12am') || lowerText.includes('at 12 am') || lowerText.includes('at midnight')) {
      time = '00:00';
    } else if (lowerText.includes('at 12pm') || lowerText.includes('at 12 pm') || lowerText.includes('at noon')) {
      time = '12:00';
    } else if (lowerText.includes('at 12')) {
      time = '12:00'; // Default to PM
    } else if (lowerText.includes('at 1pm') || lowerText.includes('at 1 pm')) {
      time = '13:00';
    } else if (lowerText.includes('at 1am') || lowerText.includes('at 1 am')) {
      time = '01:00';
    } else if (lowerText.includes('at 1')) {
      time = '13:00'; // Default to PM
    } else if (lowerText.includes('at 2pm') || lowerText.includes('at 2 pm')) {
      time = '14:00';
    } else if (lowerText.includes('at 2am') || lowerText.includes('at 2 am')) {
      time = '02:00';
    } else if (lowerText.includes('at 2')) {
      time = '14:00'; // Default to PM
    } else if (lowerText.includes('at 3pm') || lowerText.includes('at 3 pm')) {
      time = '15:00';
    } else if (lowerText.includes('at 3am') || lowerText.includes('at 3 am')) {
      time = '03:00';
    } else if (lowerText.includes('at 3')) {
      time = '15:00'; // Default to PM
    } else if (lowerText.includes('at 4pm') || lowerText.includes('at 4 pm')) {
      time = '16:00';
    } else if (lowerText.includes('at 4am') || lowerText.includes('at 4 am')) {
      time = '04:00';
    } else if (lowerText.includes('at 4')) {
      time = '16:00'; // Default to PM
    } else if (lowerText.includes('at 5pm') || lowerText.includes('at 5 pm')) {
      time = '17:00';
    } else if (lowerText.includes('at 5am') || lowerText.includes('at 5 am')) {
      time = '05:00';
    } else if (lowerText.includes('at 5')) {
      time = '17:00'; // Default to PM
    } else if (lowerText.includes('at 6pm') || lowerText.includes('at 6 pm')) {
      time = '18:00';
    } else if (lowerText.includes('at 6am') || lowerText.includes('at 6 am')) {
      time = '06:00';
    } else if (lowerText.includes('at 6')) {
      time = '18:00'; // Default to PM
    } else if (lowerText.includes('at 7pm') || lowerText.includes('at 7 pm')) {
      time = '19:00';
    } else if (lowerText.includes('at 7am') || lowerText.includes('at 7 am')) {
      time = '07:00';
    } else if (lowerText.includes('at 7')) {
      time = '19:00'; // Default to PM
    } else if (lowerText.includes('in the morning')) {
      time = '09:00';
    } else if (lowerText.includes('in the afternoon')) {
      time = '14:00';
    } else if (lowerText.includes('in the evening')) {
      time = '18:00';
    } else if (lowerText.includes('tonight')) {
      time = '20:00';
    } else if (lowerText.includes('early morning')) {
      time = '06:00';
    } else if (lowerText.includes('late night')) {
      time = '22:00';
    }

    // Extract specific times like "at 11" or "at 2:30"
    const timeMatch = lowerText.match(/at (\d{1,2})(?::(\d{2}))?(am|pm)?/);
    if (timeMatch && !time) {
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3];
      
      if (ampm === 'pm' && hour !== 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      
      time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    const dateString = targetDate.toISOString().split('T')[0];
    return { date: dateString, time };
  };

  // Legacy helper functions for backward compatibility
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getNextWeekDate = (): string => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  const getDateInDays = (days: number): string => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  };

  const _getNextWeekday = (weekday: string): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(weekday.toLowerCase());
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
    
    const nextWeekday = new Date();
    nextWeekday.setDate(today.getDate() + daysToAdd);
    return nextWeekday.toISOString().split('T')[0];
  };

  const addEmptyTask = () => {
    const newTask: EditableTask = {
      id: `task-${Date.now()}`,
      description: '',
      deadline: '',
      priority: 'medium',
      reminder_time: '',
      project: ''
    };
    setParsedTasks(prev => [...prev, newTask]);
  };

  const confirmTask = async (task: EditableTask) => {
    try {
      // Save task to Supabase
      const todoData = {
        title: task.description,
        due_date: task.deadline || undefined,
        priority: task.priority,
        notes: task.reminder_time ? (() => {
          // Convert HH:MM format to 00h00 format
          const [hours, minutes] = task.reminder_time.split(':');
          const formattedTime = `${hours}h${minutes}`;
          return `Reminder: ${formattedTime}`;
        })() : undefined,
        project: task.project || undefined,
        completed: false
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Add to saved tasks list
      setTodos([data, ...todos]);

      // Remove from parsed tasks
      setParsedTasks(prev => prev.filter(t => t.id !== task.id));

      // Add reminder if reminder time is set
      if (task.reminder_time && task.deadline) {
        const reminderText = `Remind me to ${task.description} at ${task.reminder_time} on ${task.deadline}`;
        const parsedAlarm = getAlarmTimeFromText(reminderText);
        
        if (parsedAlarm) {
          alarmManager.addAlarm(parsedAlarm);
          console.log('Reminder set for task:', task.description);
        }
      }

      console.log('Task confirmed and saved:', data);
    } catch (error) {
      console.error('Error confirming task:', error);
      setError(`Failed to confirm task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="glassy-rainbow-btn rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col border-0" style={{ boxSizing: 'border-box', maxHeight: '90vh' }}>
        {/* Modal Header */}
        <div className="relative mb-6 bg-[var(--favourite-blue)] px-4 py-3 rounded-xl mx-2 mt-2" style={{ background: 'var(--favourite-blue)' }}>
          <h2 className="text-white font-bold text-base text-center">AI To-Do Manager</h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{ background: '#111' }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="flex-1 px-4 pb-2 overflow-y-auto">
          <div className="space-y-6">
            {/* Top Panel - New Tasks */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">New Tasks</h3>
                <button
                  onClick={addEmptyTask}
                  className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                  style={{ background: '#111' }}
                >
                  Add New
                </button>
              </div>
              {/* Parsed Tasks Display */}
              {parsedTasks.length > 0 ? (
                <div className="space-y-3">
                  {parsedTasks.map((task, _index) => (
                    <div key={task.id} className="bg-black border-2 border-[var(--favourite-blue)] rounded-2xl p-4">
                      <div className="space-y-3">
                        {/* Description */}
                        <div>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) => updateParsedTask(task.id, 'description', e.target.value)}
                            className="w-full p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                            placeholder="Task description"
                          />
                        </div>
                        
                        {/* Deadline and Reminder */}
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={task.deadline}
                            onChange={(e) => updateParsedTask(task.id, 'deadline', e.target.value)}
                            className="flex-1 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                          />
                          <input
                            type="time"
                            value={task.reminder_time}
                            onChange={(e) => updateParsedTask(task.id, 'reminder_time', e.target.value)}
                            className="flex-1 p-3 border-2 border-[var(--favourite-blue)] rounded-2xl text-white bg-black focus:outline-none text-sm"
                          />
                        </div>
                        
                        {/* Confirm Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => confirmTask(task)}
                            className="px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                            style={{ background: '#111' }}
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Error Message */}
              {error && (
                <div className="bg-black border-2 border-red-500 rounded-2xl p-3 mt-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Saved Tasks Section */}
            <div>
              <h3 className="text-white font-bold text-sm mb-4">Saved Tasks</h3>
              {isLoading ? (
                <div className="text-center text-white mt-8">
                  <p>Loading tasks...</p>
                </div>
              ) : todos.length > 0 ? (
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div key={todo.id} className="bg-black border-2 border-[var(--favourite-blue)] rounded-2xl p-4 relative">
                      <button 
                        onClick={() => handleToggleComplete(todo)}
                        className="absolute top-3 right-3 px-3 py-1 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-colors border-0 text-xs"
                        style={{ background: '#111' }}
                      >
                        Complete
                      </button>
                      <div className="flex items-start justify-between pr-20">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className={`text-sm font-bold ${
                              todo.completed ? 'line-through text-gray-500' : 'text-white'
                            }`}>
                              {todo.title}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-[var(--favourite-blue)] mb-1">
                            {todo.due_date && (
                              <span>
                                {(() => {
                                  const dateInfo = formatDueDate(todo.due_date);
                                  return dateInfo.text;
                                })()}
                              </span>
                            )}
                            
                            {todo.notes && (
                              <span className="text-[var(--favourite-blue)]">
                                {todo.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-white mt-8">
                  <p>No saved tasks yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 