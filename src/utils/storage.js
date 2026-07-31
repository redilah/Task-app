const STORAGE_KEY = 'taskly_tasks_v1';

// Seed default tasks as empty array (No dummy/fake data)
const defaultTasks = [];

export const loadTasks = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTasks));
      return defaultTasks;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load tasks from localStorage', error);
    return defaultTasks;
  }
};

export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage', error);
  }
};

export const clearAllTasks = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear tasks from localStorage', error);
  }
};
