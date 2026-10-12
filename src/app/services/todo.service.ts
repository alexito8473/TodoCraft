import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Todo } from '../models/todo.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private platformId = inject(PLATFORM_ID);

  // Signal global y compartida
  todos = signal<Todo[]>([]);

  constructor() {
    this.loadFromStorage();
    this.initCrossTabSync();
  }
  private initCrossTabSync() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('storage', (event) => {
        if (event.key === 'todocraft_items' && event.newValue) {
          try {
            const parsed: Todo[] = JSON.parse(event.newValue);
            const formatted = parsed.map((t) => ({
              ...t,
              createdAt: new Date(t.createdAt),
            }));
            // Actualizamos la signal de esta pestaña con los datos de la otra
            this.todos.set(formatted);
          } catch (e) {
            console.error('Error al sincronizar entre pestañas', e);
          }
        }
      });
    }
  }
  private loadFromStorage() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('todocraft_items');
      if (saved) {
        try {
          const parsed: Todo[] = JSON.parse(saved);
          const formatted = parsed.map((t) => ({
            ...t,
            createdAt: new Date(t.createdAt),
          }));
          this.todos.set(formatted);
        } catch (e) {
          console.error('Error al cargar tareas', e);
        }
      }
    }
  }

  private saveToStorage() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('todocraft_items', JSON.stringify(this.todos()));
    }
  }

  addTodo(title: string) {
    if (!title.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: new Date(),
    };
    this.todos.update((items) => [...items, newTodo]);
    this.saveToStorage();
  }

  toggleTodo(id: string) {
    this.todos.update((items) =>
      items.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
    this.saveToStorage();
  }

  deleteTodo(id: string) {
    this.todos.update((items) => items.filter((t) => t.id !== id));
    this.saveToStorage();
  }
}
