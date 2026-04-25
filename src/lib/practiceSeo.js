// src/lib/practiceSeo.js
// SEO helpers specific to the practice quiz platform.
// Keeps schema building + breadcrumbs for /practice/* in one place.

import { SITE_CONFIG, getCanonicalUrl } from '@/lib/seoConfig';

/**
 * Build breadcrumbs for the practice hub page.
 */
export function hubBreadcrumbs() {
  return [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Practice Tests', url: getCanonicalUrl('/practice') },
  ];
}

/**
 * Build breadcrumbs for a specific quiz.
 */
export function quizBreadcrumbs(quizMeta) {
  return [
    ...hubBreadcrumbs(),
    { name: quizMeta.shortTitle, url: getCanonicalUrl(`/practice/${quizMeta.slug}`) },
  ];
}

/**
 * Breadcrumbs for a topic page.
 */
export function topicBreadcrumbs(quizMeta, topic) {
  return [
    ...quizBreadcrumbs(quizMeta),
    { name: topic.name, url: getCanonicalUrl(`/practice/${quizMeta.slug}/topics/${topic.slug}`) },
  ];
}

/**
 * Breadcrumbs for a single question deep link.
 */
export function questionBreadcrumbs(quizMeta, question) {
  return [
    ...quizBreadcrumbs(quizMeta),
    { name: 'Question', url: getCanonicalUrl(`/practice/${quizMeta.slug}/q/${question.slug}`) },
  ];
}

/**
 * Quiz schema.org JSON-LD for a practice quiz.
 * https://schema.org/Quiz
 */
export function getQuizSchema(quizMeta, questions = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quizMeta.title,
    description: quizMeta.description,
    about: {
      '@type': 'Thing',
      name: `${quizMeta.provider} ${quizMeta.shortTitle}`,
    },
    educationalLevel: quizMeta.difficulty,
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    url: getCanonicalUrl(`/practice/${quizMeta.slug}`),
    numberOfQuestions: questions.length,
    timeRequired: `PT${quizMeta.durationMinutes}M`,
    inLanguage: 'en-US',
    learningResourceType: 'Practice Test',
    typicalAgeRange: '18-',
    isAccessibleForFree: true,
  };
}

/**
 * LearningResource schema for the practice hub.
 */
export function getHubSchema(quizzes) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'Free Data Engineering Certification Practice Tests',
    description:
      'Interactive practice exams for SnowPro Core, SnowPro Specialty Gen AI, and Databricks Data Engineer Associate certifications.',
    url: getCanonicalUrl('/practice'),
    provider: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    isAccessibleForFree: true,
    learningResourceType: 'Practice Test',
    hasPart: quizzes.map((q) => ({
      '@type': 'Quiz',
      name: q.title,
      url: getCanonicalUrl(`/practice/${q.slug}`),
    })),
  };
}

/**
 * Question schema for a deep-linked single question page.
 * https://schema.org/Question
 */
export function getQuestionSchema(question, quizMeta) {
  const correctOptions = (question.options || [])
    .filter((o) => question.correctIds.includes(o.id))
    .map((o) => o.text)
    .join('; ');
  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: question.stem,
    url: getCanonicalUrl(`/practice/${quizMeta.slug}/q/${question.slug}`),
    text: question.stem,
    answerCount: 1,
    acceptedAnswer: {
      '@type': 'Answer',
      text: `${correctOptions}. ${question.explanation}`,
    },
    suggestedAnswer: (question.options || []).map((o) => ({
      '@type': 'Answer',
      text: o.text,
      position: o.id,
    })),
    isPartOf: {
      '@type': 'Quiz',
      name: quizMeta.title,
      url: getCanonicalUrl(`/practice/${quizMeta.slug}`),
    },
  };
}

/**
 * FAQPage schema for the hub / quiz page (helps Google show rich snippets).
 */
export function getFaqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
