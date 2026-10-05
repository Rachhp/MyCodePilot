import { LanguageConfig, SupportedLanguage } from '../types';

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: 'ts',
    prismLang: 'typescript',
    category: 'web',
    defaultCode: `// User authentication & caching service
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  passwordHash: string;
}

export class UserService {
  private cache = new Map<string, User>();

  // POTENTIAL ISSUE: Missing validation & SQL injection risk in query
  async findUserByEmail(email: string, db: any): Promise<User | null> {
    if (this.cache.has(email)) {
      return this.cache.get(email)!;
    }

    // Direct string interpolation into SQL query (Security flaw)
    const query = "SELECT * FROM users WHERE email = '" + email + "'";
    const result = await db.query(query);

    if (result.rows.length === 0) {
      return null;
    }

    const user: User = result.rows[0];
    this.cache.set(email, user);
    return user;
  }

  // POTENTIAL ISSUE: Inefficient O(n^2) nested loop for deduplication
  findCommonAdmins(teamA: User[], teamB: User[]): User[] {
    const common: User[] = [];
    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        if (teamA[i].id === teamB[j].id && teamA[i].role === 'admin') {
          common.push(teamA[i]);
        }
      }
    }
    return common;
  }
}`,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    prismLang: 'javascript',
    category: 'web',
    defaultCode: `// Shopping cart checkout calculation
function processCheckout(cart, discountCode) {
  let subtotal = 0;

  // Unhandled null or undefined cart
  for (let i = 0; i < cart.items.length; i++) {
    const item = cart.items[i];
    // Potential floating point precision error
    subtotal += item.price * item.quantity;
  }

  // Hardcoded discount logic without boundary checks
  let discount = 0;
  if (discountCode === "SUMMER20") {
    discount = subtotal * 0.20;
  } else if (discountCode === "FLASH50") {
    discount = subtotal * 0.50;
  }

  const taxRate = 0.0825;
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax;

  return {
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2)
  };
}`,
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    prismLang: 'python',
    category: 'backend',
    defaultCode: `import hashlib
import os

class PasswordManager:
    def __init__(self):
        self.user_database = {}

    def register_user(self, username: str, password: str):
        # SECURITY FLAW: Using weak MD5 hash without unique salt
        hasher = hashlib.md5()
        hasher.update(password.encode('utf-8'))
        password_hash = hasher.hexdigest()

        # BUG: Does not check if username already exists
        self.user_database[username] = password_hash
        return True

    def authenticate(self, username: str, password: str) -> bool:
        if username not in self.user_database:
            return False

        hasher = hashlib.md5()
        hasher.update(password.encode('utf-8'))
        
        # Insecure timing attack vulnerability: != comparison
        return self.user_database[username] == hasher.hexdigest()

# Example usage
manager = PasswordManager()
manager.register_user("alice", "SuperSecret123")
print("Auth Alice:", manager.authenticate("alice", "SuperSecret123"))`,
  },
  {
    id: 'java',
    name: 'Java',
    extension: 'java',
    prismLang: 'java',
    category: 'backend',
    defaultCode: `package com.codepilot.demo;

import java.util.*;

public class LRUCache<K, V> {
    private final int capacity;
    private final Map<K, V> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        // Non-thread-safe linked hash map without synchronization
        this.map = new LinkedHashMap<K, V>(capacity, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public synchronized V get(K key) {
        return map.getOrDefault(key, null);
    }

    public synchronized void put(K key, V value) {
        // Potential NullPointerException if value is null
        if (key == null) {
            throw new IllegalArgumentException("Key cannot be null");
        }
        map.put(key, value);
    }

    public int size() {
        return map.size();
    }
}`,
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: 'cpp',
    prismLang: 'cpp',
    category: 'systems',
    defaultCode: `#include <iostream>
#include <vector>
#include <string>

class BufferManager {
private:
    char* rawBuffer;
    size_t bufferSize;

public:
    BufferManager(size_t size) : bufferSize(size) {
        rawBuffer = new char[size];
    }

    // POTENTIAL BUG: Missing Destructor / Rule of Three/Five (Memory Leak)
    // ~BufferManager() { delete[] rawBuffer; }

    void writeData(const std::string& input) {
        // POTENTIAL BUFFER OVERFLOW: No boundary check against bufferSize
        for (size_t i = 0; i < input.length(); ++i) {
            rawBuffer[i] = input[i];
        }
    }

    void printPreview() const {
        std::cout << "Buffer preview: " << rawBuffer << std::endl;
    }
};

int main() {
    BufferManager manager(16);
    manager.writeData("Hello, CodePilot C++ World!");
    manager.printPreview();
    return 0;
}`,
  },
  {
    id: 'csharp',
    name: 'C#',
    extension: 'cs',
    prismLang: 'csharp',
    category: 'backend',
    defaultCode: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CodePilot.Demo
{
    public class OrderProcessor
    {
        private static readonly List<string> ProcessedOrders = new();

        // POTENTIAL BUG: Race condition on non-thread-safe collection
        public async Task<bool> ProcessOrderAsync(string orderId, decimal amount)
        {
            if (string.IsNullOrEmpty(orderId))
                throw new ArgumentNullException(nameof(orderId));

            // Simulating external I/O payment gateway call
            await Task.Delay(50);

            if (amount <= 0)
                return false;

            // Shared state modification without locking
            ProcessedOrders.Add(orderId);
            return true;
        }

        public int GetCompletedCount() => ProcessedOrders.Count;
    }
}`,
  },
  {
    id: 'go',
    name: 'Go',
    extension: 'go',
    prismLang: 'go',
    category: 'systems',
    defaultCode: `package main

import (
	"fmt"
	"sync"
	"time"
)

type WorkerPool struct {
	tasks   chan int
	results chan int
	wg      sync.WaitGroup
}

func NewWorkerPool(workerCount int) *WorkerPool {
	return &WorkerPool{
		tasks:   make(chan int, 100),
		results: make(chan int, 100),
	}
}

// POTENTIAL BUG: Goroutine leak if channel never closes
func (p *WorkerPool) Start(workerCount int) {
	for i := 0; i < workerCount; i++ {
		p.wg.Add(1)
		go func(workerID int) {
			defer p.wg.Done()
			for task := range p.tasks {
				// Process task
				time.Sleep(10 * time.Millisecond)
				p.results <- task * 2
			}
		}(i)
	}
}

func main() {
	pool := NewWorkerPool(3)
	pool.Start(3)
	pool.tasks <- 21
	fmt.Println("Result:", <-pool.results)
}`,
  },
  {
    id: 'rust',
    name: 'Rust',
    extension: 'rs',
    prismLang: 'rust',
    category: 'systems',
    defaultCode: `use std::collections::HashMap;

pub struct MetricsCollector {
    counters: HashMap<String, u64>,
}

impl MetricsCollector {
    pub fn new() -> Self {
        MetricsCollector {
            counters: HashMap::new(),
        }
    }

    pub fn record_hit(&mut self, key: &str) {
        let counter = self.counters.entry(key.to_string()).or_insert(0);
        *counter += 1;
    }

    pub fn get_hit_rate(&self, key: &str, total: u64) -> Result<f64, &'static str> {
        // Potential division by zero
        if total == 0 {
            return Err("Total count cannot be zero");
        }

        let hits = self.counters.get(key).copied().unwrap_or(0);
        Ok(hits as f64 / total as f64)
    }
}

fn main() {
    let mut collector = MetricsCollector::new();
    collector.record_hit("api/v1/users");
    println!("Rate: {:?}", collector.get_hit_rate("api/v1/users", 10));
}`,
  },
  {
    id: 'php',
    name: 'PHP',
    extension: 'php',
    prismLang: 'php',
    category: 'backend',
    defaultCode: `<?php

class FileUploader {
    private string $uploadDir;

    public function __construct(string $uploadDir) {
        $this->uploadDir = rtrim($uploadDir, '/') . '/';
    }

    // CRITICAL SECURITY VULNERABILITY: Path traversal & unrestricted file upload
    public function handleUpload(array $file): bool {
        $filename = $file['name'];
        $targetPath = $this->uploadDir . $filename;

        // Missing mime-type validation and extension whitelist!
        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            return true;
        }

        return false;
    }
}

$uploader = new FileUploader('/var/www/uploads');
?>`,
  },
  {
    id: 'sql',
    name: 'SQL',
    extension: 'sql',
    prismLang: 'sql',
    category: 'data',
    defaultCode: `-- High-traffic analytics query with potential performance bottlenecks
-- Problem: Missing indexes on status & created_at, full table scan on orders
SELECT 
    c.customer_id,
    c.company_name,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS revenue,
    AVG(DATEDIFF(day, o.order_date, o.shipped_date)) AS avg_shipping_days
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status != 'CANCELLED' 
  AND o.created_at >= '2025-01-01'
GROUP BY c.customer_id, c.company_name
HAVING SUM(o.total_amount) > 10000
ORDER BY revenue DESC;`,
  },
  {
    id: 'html',
    name: 'HTML',
    extension: 'html',
    prismLang: 'markup',
    category: 'web',
    defaultCode: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Customer Feedback Form</title>
</head>
<body>
  <!-- Accessibility issues: missing form labels and aria attributes -->
  <main class="container">
    <h1>Submit Feedback</h1>
    <form action="/submit" method="POST">
      <input type="text" name="name" placeholder="Your Full Name">
      <input type="email" name="email" placeholder="Email Address">
      <textarea name="comment" placeholder="Your thoughts..."></textarea>
      <button type="submit">Submit Feedback</button>
    </form>
  </main>
</body>
</html>`,
  },
  {
    id: 'css',
    name: 'CSS',
    extension: 'css',
    prismLang: 'css',
    category: 'web',
    defaultCode: `/* Modern Responsive Card Component */
.developer-card {
  display: flex;
  flex-direction: column;
  background: #1e1e24;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.developer-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.5);
  border-color: #3b82f6;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #f3f4f6;
  margin-bottom: 0.5rem;
}`,
  },
  {
    id: 'json',
    name: 'JSON',
    extension: 'json',
    prismLang: 'json',
    category: 'data',
    defaultCode: `{
  "name": "codepilot-workspace",
  "version": "1.0.0",
  "description": "Developer configuration for CodePilot AI suite",
  "settings": {
    "editor.fontSize": 14,
    "editor.tabSize": 2,
    "editor.wordWrap": "on",
    "ai.model": "gemini-3.8-flash",
    "ai.temperature": 0.2,
    "ai.autoExplain": false
  },
  "extensions": [
    "codepilot.vscode-core",
    "codepilot.security-scanner",
    "codepilot.git-review"
  ]
}`,
  },
];

export const INITIAL_FILES: LanguageConfig[] = SUPPORTED_LANGUAGES;
