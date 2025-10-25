// src/utils/sampleCertificationData.js
// Sample data generator for testing certifications without WordPress backend

export const sampleProviders = [
  { id: 1, name: 'AWS', slug: 'aws' },
  { id: 2, name: 'Azure', slug: 'azure' },
  { id: 3, name: 'Snowflake', slug: 'snowflake' },
  { id: 4, name: 'GCP', slug: 'gcp' },
  { id: 5, name: 'Apache', slug: 'apache' },
  { id: 6, name: 'dbt Labs', slug: 'dbt-labs' },
];

export const sampleLevels = [
  { id: 1, name: 'Foundational', slug: 'foundational' },
  { id: 2, name: 'Associate', slug: 'associate' },
  { id: 3, name: 'Professional', slug: 'professional' },
  { id: 4, name: 'Specialty', slug: 'specialty' },
  { id: 5, name: 'Expert', slug: 'expert' },
];

export const sampleResourceTypes = [
  { id: 1, name: 'Cheat Sheet', slug: 'cheat-sheet', description: 'Quick reference guides', count: 15 },
  { id: 2, name: 'Practice Questions', slug: 'practice-questions', description: 'Exam practice tests', count: 12 },
  { id: 3, name: 'Study Guide', slug: 'study-guide', description: 'Comprehensive study materials', count: 8 },
  { id: 4, name: 'Exam Tips', slug: 'exam-tips', description: 'Expert exam-taking strategies', count: 10 },
  { id: 5, name: 'Video Course', slug: 'video-course', description: 'Video tutorials', count: 5 },
];

export const sampleCertifications = [
  {
    id: 1,
    title: 'AWS Certified Solutions Architect - Associate',
    slug: 'aws-saa-c03',
    cert_code: 'SAA-C03',
    cert_official_name: 'AWS Solutions Architect Associate',
    excerpt: '<p>Master AWS architecture principles and become a certified solutions architect.</p>',
    content: '<h2>About This Certification</h2><p>The AWS Certified Solutions Architect - Associate exam validates your ability to design and implement distributed systems on AWS.</p><h3>Key Topics</h3><ul><li>Compute Services (EC2, Lambda)</li><li>Storage Solutions (S3, EBS)</li><li>Networking & Content Delivery</li><li>Security & Compliance</li></ul>',
    featured_image: 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Solutions-Architect-Associate_badge.3419559c682629072f1eb968d59dea0741772c0f.png',
    provider: sampleProviders[0],
    level: sampleLevels[1],
    resource_types: [sampleResourceTypes[0], sampleResourceTypes[1], sampleResourceTypes[2]],
    exam_cost: '$150',
    duration: '130 minutes',
    questions_count: '65',
    passing_score: '720/1000',
    featured: true,
    download_url: '#',
  },
  {
    id: 2,
    title: 'Azure Data Engineer Associate',
    slug: 'azure-dp-203',
    cert_code: 'DP-203',
    cert_official_name: 'Microsoft Azure Data Engineer Associate',
    excerpt: '<p>Design and implement data solutions on Azure using various data services.</p>',
    content: '<h2>Certification Overview</h2><p>This certification validates your expertise in integrating, transforming, and consolidating data from various sources.</p>',
    featured_image: 'https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-associate-badge.svg',
    provider: sampleProviders[1],
    level: sampleLevels[1],
    resource_types: [sampleResourceTypes[0], sampleResourceTypes[3]],
    exam_cost: '$165',
    duration: '150 minutes',
    questions_count: '40-60',
    passing_score: '700/1000',
    featured: true,
    download_url: '#',
  },
  {
    id: 3,
    title: 'SnowPro Core Certification',
    slug: 'snowflake-snowpro-core',
    cert_code: 'COF-C02',
    cert_official_name: 'SnowPro Core Certification',
    excerpt: '<p>Demonstrate foundational knowledge of Snowflake cloud data platform.</p>',
    content: '<h2>What You\'ll Learn</h2><p>Master the fundamentals of Snowflake architecture, data loading, and SQL operations.</p>',
    featured_image: 'https://www.snowflake.com/wp-content/themes/snowflake/assets/img/brand-guidelines/logo-sno-blue-example.svg',
    provider: sampleProviders[2],
    level: sampleLevels[0],
    resource_types: [sampleResourceTypes[0], sampleResourceTypes[1], sampleResourceTypes[3]],
    exam_cost: '$175',
    duration: '115 minutes',
    questions_count: '100',
    passing_score: '750/1000',
    featured: false,
    download_url: null,
  },
  {
    id: 4,
    title: 'Google Cloud Professional Data Engineer',
    slug: 'gcp-professional-data-engineer',
    cert_code: 'PDE',
    cert_official_name: 'Google Cloud Professional Data Engineer',
    excerpt: '<p>Design, build, and operationalize data processing systems on Google Cloud.</p>',
    content: '<h2>Exam Details</h2><p>This professional-level certification focuses on data engineering best practices on GCP.</p>',
    featured_image: 'https://cdn.qwiklabs.com/2PkLJiTs0NRVyp%2FYb%2FSiTWoWG1Y7h%2FJC5OYxhN6fFfU%3D',
    provider: sampleProviders[3],
    level: sampleLevels[2],
    resource_types: [sampleResourceTypes[1], sampleResourceTypes[2]],
    exam_cost: '$200',
    duration: '120 minutes',
    questions_count: '50-60',
    passing_score: 'Pass/Fail',
    featured: false,
    download_url: '#',
  },
  {
    id: 5,
    title: 'dbt Analytics Engineering Certification',
    slug: 'dbt-analytics-engineering',
    cert_code: 'dbt-AE',
    cert_official_name: 'dbt Analytics Engineering Certification',
    excerpt: '<p>Prove your expertise in modern data transformation with dbt.</p>',
    content: '<h2>Certification Path</h2><p>Learn to build scalable, tested, and documented data transformation pipelines.</p>',
    featured_image: 'https://docs.getdbt.com/img/dbt-logo.svg',
    provider: sampleProviders[5],
    level: sampleLevels[1],
    resource_types: [sampleResourceTypes[0], sampleResourceTypes[3], sampleResourceTypes[4]],
    exam_cost: 'Free',
    duration: '90 minutes',
    questions_count: '40',
    passing_score: '80%',
    featured: true,
    download_url: '#',
  },
  {
    id: 6,
    title: 'Apache Airflow Fundamentals',
    slug: 'apache-airflow-fundamentals',
    cert_code: 'AAF-101',
    cert_official_name: 'Apache Airflow Fundamentals Certification',
    excerpt: '<p>Master the fundamentals of workflow orchestration with Apache Airflow.</p>',
    content: '<h2>What This Covers</h2><p>Learn to build, schedule, and monitor data pipelines using Airflow.</p>',
    featured_image: 'https://raw.githubusercontent.com/devicons/devicon/refs/heads/master/icons/apacheairflow/apacheairflow-original.svg',
    provider: sampleProviders[4],
    level: sampleLevels[0],
    resource_types: [sampleResourceTypes[2], sampleResourceTypes[4]],
    exam_cost: 'Free',
    duration: '60 minutes',
    questions_count: '30',
    passing_score: '70%',
    featured: false,
    download_url: null,
  },
  {
    id: 7,
    title: 'AWS Certified Data Analytics - Specialty',
    slug: 'aws-das-c01',
    cert_code: 'DAS-C01',
    cert_official_name: 'AWS Data Analytics Specialty',
    excerpt: '<p>Demonstrate expertise in designing and implementing AWS data analytics solutions.</p>',
    content: '<h2>Advanced Analytics</h2><p>Focus on collection, storage, processing, and visualization of data on AWS.</p>',
    featured_image: 'https://d1.awsstatic.com/training-and-certification/certification-badges/AWS-Certified-Data-Analytics-Specialty_badge.1d7e1d43073cd3beaf5d4c4ee8f88ad577e4e48a.png',
    provider: sampleProviders[0],
    level: sampleLevels[3],
    resource_types: [sampleResourceTypes[1], sampleResourceTypes[2], sampleResourceTypes[3]],
    exam_cost: '$300',
    duration: '180 minutes',
    questions_count: '65',
    passing_score: '750/1000',
    featured: false,
    download_url: '#',
  },
  {
    id: 8,
    title: 'Azure Database Administrator',
    slug: 'azure-dp-300',
    cert_code: 'DP-300',
    cert_official_name: 'Azure Database Administrator Associate',
    excerpt: '<p>Manage SQL Server and Azure SQL database infrastructure.</p>',
    content: '<h2>Database Management</h2><p>Learn to implement and manage operational aspects of cloud-native databases.</p>',
    featured_image: 'https://learn.microsoft.com/en-us/media/learn/certification/badges/microsoft-certified-associate-badge.svg',
    provider: sampleProviders[1],
    level: sampleLevels[1],
    resource_types: [sampleResourceTypes[0], sampleResourceTypes[1]],
    exam_cost: '$165',
    duration: '120 minutes',
    questions_count: '40-60',
    passing_score: '700/1000',
    featured: false,
    download_url: '#',
  },
];

// Helper function to filter certifications
export const filterCertifications = (certifications, filters) => {
  return certifications.filter(cert => {
    const searchMatch = 
      !filters.search || 
      cert.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      cert.cert_code.toLowerCase().includes(filters.search.toLowerCase());
    
    const providerMatch = 
      filters.provider === 'all' || 
      cert.provider?.slug === filters.provider;
    
    const levelMatch = 
      filters.level === 'all' || 
      cert.level?.slug === filters.level;
    
    return searchMatch && providerMatch && levelMatch;
  });
};

// Helper to get certifications by resource type
export const getCertificationsByResourceType = (certifications, resourceTypeSlug) => {
  return certifications.filter(cert => 
    cert.resource_types.some(rt => rt.slug === resourceTypeSlug)
  );
};