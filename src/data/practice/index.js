// src/data/practice/index.js
// Registry of all practice quizzes. Import this to get the full catalog.

import snowproCoreMeta from './snowpro-core/metadata.json';
import snowproCoreTopics from './snowpro-core/topics.json';
import snowproCoreQuestions from './snowpro-core/questions.json';

import snowproGenaiMeta from './snowpro-genai/metadata.json';
import snowproGenaiTopics from './snowpro-genai/topics.json';
import snowproGenaiQuestions from './snowpro-genai/questions.json';

import databricksDeMeta from './databricks-de/metadata.json';
import databricksDeTopics from './databricks-de/topics.json';
import databricksDeQuestions from './databricks-de/questions.json';

import awsDeAssociateMeta from './aws-de-associate/metadata.json';
import awsDeAssociateTopics from './aws-de-associate/topics.json';
import awsDeAssociateQuestions from './aws-de-associate/questions.json';

/**
 * Full quiz registry. Each entry has the shape:
 *   { meta: QuizMeta, topics: Topic[], questions: Question[] }
 */
export const QUIZZES = {
  'snowpro-core': {
    meta: snowproCoreMeta,
    topics: snowproCoreTopics,
    questions: snowproCoreQuestions,
  },
  'snowpro-genai': {
    meta: snowproGenaiMeta,
    topics: snowproGenaiTopics,
    questions: snowproGenaiQuestions,
  },
  'databricks-de': {
    meta: databricksDeMeta,
    topics: databricksDeTopics,
    questions: databricksDeQuestions,
  },
  'aws-de-associate': {
    meta: awsDeAssociateMeta,
    topics: awsDeAssociateTopics,
    questions: awsDeAssociateQuestions,
  },
};

export const QUIZ_SLUGS = Object.keys(QUIZZES);

/** @param {string} slug */
export function getQuiz(slug) {
  return QUIZZES[slug] || null;
}

/** All quiz metadata for the hub page. */
export function getAllQuizMeta() {
  return QUIZ_SLUGS.map((slug) => QUIZZES[slug].meta);
}

/** Find a single question by quiz slug + question slug (for deep links). */
export function getQuestionBySlug(quizSlug, questionSlug) {
  const quiz = getQuiz(quizSlug);
  if (!quiz) return null;
  return quiz.questions.find((q) => q.slug === questionSlug) || null;
}

/** Find topic by slug within a quiz. */
export function getTopicBySlug(quizSlug, topicSlug) {
  const quiz = getQuiz(quizSlug);
  if (!quiz) return null;
  return quiz.topics.find((t) => t.slug === topicSlug) || null;
}

/** Questions filtered by topic. */
export function getQuestionsForTopic(quizSlug, topicSlug) {
  const quiz = getQuiz(quizSlug);
  if (!quiz) return [];
  return quiz.questions.filter((q) => q.topicSlug === topicSlug);
}
