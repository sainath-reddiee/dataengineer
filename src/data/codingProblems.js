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
  {
    slug: 'dept-payroll',
    title: 'Payroll by department',
    difficulty: 'easy',
    topic: 'Aggregation',
    table: 'employees',
    prompt: 'Sum salary per department as payroll. Order by payroll descending.',
    starterSql: `SELECT department, SUM(salary) AS payroll
FROM employees
GROUP BY department
ORDER BY payroll DESC;`,
    requiredColumns: ['department', 'payroll'],
  },
  {
    slug: 'hires-by-year',
    title: 'Hires by year',
    difficulty: 'easy',
    topic: 'Aggregation',
    table: 'employees',
    prompt: 'Count hires per calendar year of hire_date. Return hire_year and n.',
    starterSql: `SELECT CAST(strftime(hire_date, '%Y') AS INTEGER) AS hire_year, COUNT(*) AS n
FROM employees
GROUP BY 1
ORDER BY hire_year;`,
    requiredColumns: ['hire_year', 'n'],
  },
  {
    slug: 'north-revenue',
    title: 'North region revenue',
    difficulty: 'easy',
    topic: 'Filters',
    table: 'orders',
    prompt: 'Total quantity * unit_price for region North. One row, alias revenue.',
    starterSql: `SELECT SUM(quantity * unit_price) AS revenue
FROM orders
WHERE region = 'North';`,
    requiredColumns: ['revenue'],
  },
  {
    slug: 'first-order-per-customer',
    title: 'First order date per customer',
    difficulty: 'medium',
    topic: 'Aggregation',
    table: 'orders',
    prompt: 'For each customer_id, the earliest order_date as first_order.',
    starterSql: `SELECT customer_id, MIN(order_date) AS first_order
FROM orders
GROUP BY customer_id
ORDER BY customer_id;`,
    requiredColumns: ['customer_id', 'first_order'],
  },
  {
    slug: 'running-revenue',
    title: 'Running revenue by order date',
    difficulty: 'medium',
    topic: 'Windows',
    table: 'orders',
    prompt: 'Per order, revenue = quantity * unit_price and running_revenue ordered by order_date, order_id using ROWS.',
    starterSql: `SELECT
  order_id,
  order_date,
  quantity * unit_price AS revenue,
  SUM(quantity * unit_price) OVER (
    ORDER BY order_date, order_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_revenue
FROM orders
ORDER BY order_date, order_id;`,
    requiredColumns: ['order_id', 'order_date', 'revenue', 'running_revenue'],
  },
  {
    slug: 'never-purchased-users',
    title: 'Users who never purchased',
    difficulty: 'medium',
    topic: 'Joins',
    table: 'web_events',
    pro: true,
    prompt:
      'Distinct user_id values that have a page_view but no purchase event. Alias user_id. Hub Pro pad — same sample table, interview-shaped anti-join.',
    starterSql: `SELECT DISTINCT v.user_id
FROM web_events v
WHERE v.event_type = 'page_view'
  AND NOT EXISTS (
    SELECT 1
    FROM web_events p
    WHERE p.user_id = v.user_id
      AND p.event_type = 'purchase'
  )
ORDER BY v.user_id;`,
    requiredColumns: ['user_id'],
  },
  {
    slug: 'dept-salary-rank',
    title: 'Salary rank inside the department',
    difficulty: 'medium',
    topic: 'Windows',
    table: 'employees',
    pro: true,
    prompt:
      'For every employee, dept_rank = DENSE_RANK of salary descending inside the department. Hub Pro: explain why DENSE_RANK vs ROW_NUMBER if two people share a salary.',
    starterSql: `SELECT
  name,
  department,
  salary,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_rank
FROM employees
ORDER BY department, dept_rank, name;`,
    requiredColumns: ['name', 'department', 'salary', 'dept_rank'],
  },
  {
    slug: 'customer-ltv',
    title: 'Customer lifetime revenue',
    difficulty: 'hard',
    topic: 'Aggregation',
    table: 'orders',
    pro: true,
    prompt:
      'Per customer_id: order_count, ltv = SUM(quantity * unit_price), ordered by ltv descending. Hub Pro pad used in the interview loop.',
    starterSql: `SELECT
  customer_id,
  COUNT(*) AS order_count,
  SUM(quantity * unit_price) AS ltv
FROM orders
GROUP BY customer_id
ORDER BY ltv DESC, customer_id;`,
    requiredColumns: ['customer_id', 'order_count', 'ltv'],
  },
  {
    slug: 'session-flags',
    title: '30-minute session flags',
    difficulty: 'hard',
    topic: 'Windows',
    table: 'web_events',
    pro: true,
    prompt:
      'Per user, ordered by ts: prev_ts = LAG(ts), new_session = 1 when prev_ts is null or ts is more than 30 minutes after prev_ts, else 0. Hub Pro sessionization sketch.',
    starterSql: `SELECT
  user_id,
  ts,
  LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) AS prev_ts,
  CASE
    WHEN LAG(ts) OVER (PARTITION BY user_id ORDER BY ts) IS NULL THEN 1
    WHEN date_diff('minute', LAG(ts) OVER (PARTITION BY user_id ORDER BY ts), ts) > 30 THEN 1
    ELSE 0
  END AS new_session
FROM web_events
ORDER BY user_id, ts;`,
    requiredColumns: ['user_id', 'ts', 'prev_ts', 'new_session'],
  },
];

export const CODING_TRACKS = ['Aggregation', 'Windows', 'Joins', 'Filters'];

export function isCodingProblemFree(problem) {
  return !problem?.pro;
}

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
