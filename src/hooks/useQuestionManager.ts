// src/hooks/useQuestionManager.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { generateQuestion } from "@/lib/generators";
import { Question, OperationType, Level } from "@/types";

export const useQuestionManager = (
  operation: OperationType,
  level: Level,
  totalQuestions: number = 10
) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Inisialisasi soal di awal
  useEffect(() => {
    const newQuestions = Array.from({ length: totalQuestions }, () =>
      generateQuestion(operation, level)
    );
    setQuestions(newQuestions);
  }, [operation, level, totalQuestions]);

  const currentQuestion = questions[currentIndex];

  const submitAnswer = (userAnswer: number): boolean => {
    const isCorrect = userAnswer === currentQuestion.answer;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    return isCorrect;
  };

  const nextQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  }, [currentIndex, totalQuestions]);

  return {
    currentQuestion,
    currentIndex,
    score,
    totalQuestions,
    isFinished,
    submitAnswer,
    nextQuestion,
  };
};
