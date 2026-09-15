import { playgroundSqlHref } from '../utils/looksLikeSql.js';

/** Original SQL pads on the playground sample tables. Not a copy of another site's warehouse. */
export const CODING_PROBLEMS = [
  {
    slug: 'dept-headcount',
    title: 'Headcount by department',
    difficulty: 'easy',
    topic: 'Aggregation',
    table: 'employees',
    prompt: 'Count employees per department. Return department and n, ordered by n descending.',
    starterSql: `SELECT department, COUNT(*) AS n
FROM employees
GROUP BY department
ORDER BY n DESC;`,
    requiredColumns: ['department', 'n'],
  },
  {
    slug: 'top-salary-per-dept',
    title: 'Highest salary per department',
    difficulty: 'easy',
    topic: 'Windows',
    table: 'employees',
    prompt: 'One row per department: the person with the highest salary. Ties: pick the lowest id.',
    starterSql: `SELECT department, name, salary
FROM (
  SELECT
    department,
    name,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC, id) AS rn
  FROM employees
)
WHERE rn = 1;`,
    requiredColumns: ['department', 'name', 'salary'],
  },
  {
    slug: 'salary-above-dept-avg',
    title: 'Above the department average',
    difficulty: 'medium',
    topic: 'Windows',
    table: 'employees',
    prompt: 'List people whose salary is strictly above their department average. Include dept_avg.',
    starterSql: `SELECT name, department, salary, dept_avg
FROM (
  SELECT
    name,
    department,
    salary,
    AVG(salary) OVER (PARTITION BY department) AS dept_avg
  FROM employees
)
WHERE salary > dept_avg
ORDER BY department, salary DESC;`,
    requiredColumns: ['name', 'department', 'salary', 'dept_avg'],
  },
  {
    slug: 'revenue-by-region',
    title: 'Order revenue by region',
    difficulty: 'easy',
    topic: 'Aggregation',
    table: 'orders',
    prompt: 'Sum quantity * unit_price per region. Call the total revenue. Order by revenue descending.',
    starterSql: `SELECT region, SUM(quantity * unit_price) AS revenue
FROM orders
GROUP BY region
ORDER BY revenue DESC;`,
    requiredColumns: ['region', 'revenue'],
  },
  {
    slug: 'repeat-customers',
    title: 'Repeat buyers',
    difficulty: 'medium',
    topic: 'Joins',
    table: 'orders',
    prompt: 'Customers with more than one order. Return customer_id and order_count.',
    starterSql: `SELECT customer_id, COUNT(*) AS order_count
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY order_count DESC, customer_id;`,
    requiredColumns: ['customer_id', 'order_count'],
  },
  {
    slug: 'aov-by-product',
    title: 'Average order value by product',
    difficulty: 'medium',
    topic: 'Aggregation',
    table: 'orders',
    prompt: 'For each product, average of quantity * unit_price. Alias aov. Order by aov descending.',
    starterSql: `SELECT product, AVG(quantity * unit_price) AS aov
FROM orders
GROUP BY product
ORDER BY aov DESC;`,
    requiredColumns: ['product', 'aov'],
  },
  {
    slug: 'event-funnel',
    title: 'Event funnel counts',
    difficulty: 'easy',
    topic: 'Aggregation',
    table: 'web_events',
    prompt: 'Count rows per event_type. Return event_type and n, ordered by n descending.',
    starterSql: `SELECT event_type, COUNT(*) AS n
FROM web_events
GROUP BY event_type
ORDER BY n DESC;`,
    requiredColumns: ['event_type', 'n'],
  },
  {
    slug: 'mobile-purchases',
    title: 'Mobile purchases',
    difficulty: 'medium',
    topic: 'Filters',
    table: 'web_events',
    prompt: 'Purchases on mobile. Return user_id, page, ts ordered by ts.',
    starterSql: `SELECT user_id, page, ts
FROM web_events
WHERE event_type = 'purchase' AND device = 'mobile'
ORDER BY ts;`,
    requiredColumns: ['user_id', 'page', 'ts'],
  },
];

export function codingProblemBySlug(slug) {
  return CODING_PROBLEMS.find((item) => item.slug === slug) || null;
}

export function codingProblemHref(problem) {
  return playgroundSqlHref(problem.starterSql, 4000, problem.slug);
}

export function columnsMatchProblem(columns, problem) {
  const have = (columns || []).map((c) => String(c).toLowerCase());
  return (problem.requiredColumns || []).every((col) => have.includes(String(col).toLowerCase()));
}
