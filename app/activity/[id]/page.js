"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  GraduationCap,
  RefreshCw,
  Trophy,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShareButton from "@/components/ui/ShareButton";
import { useAuth } from "@/hooks/useAuth";
import { getUserActivities } from "@/services/activityService";
import { getQuizDataByTitle } from "@/constants/quizData";

export default function ActivityGame() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const activityId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadActivities = async () => {
      if (!user?.uid) {
        setActivities([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const userActivities = await getUserActivities(user.uid);

      if (!cancelled) {
        setActivities(userActivities);
        setLoading(false);
      }
    };

    loadActivities();

    return () => {
      cancelled = true;
    };
  }, [user, activityId]);

  useEffect(() => {
    setAnswers({});
    setSubmitted(false);
  }, [activityId]);

  const activity = useMemo(
    () => activities.find((item) => item.id === activityId),
    [activities, activityId],
  );

  const quiz = activity ? getQuizDataByTitle(activity.title) : null;

  const score = useMemo(() => {
    if (!quiz) return 0;
    return quiz.questions.reduce(
      (total, question) => total + (answers[question.id] === question.answer ? 1 : 0),
      0,
    );
  }, [answers, quiz]);

  const percentage = quiz
    ? Math.round((score / quiz.questions.length) * 100)
    : 0;

  const handleSelect = (questionId, optionIndex) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleRestart = () => {
    setAnswers({});
    setSubmitted(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <Card className="w-full max-w-xl border-border bg-card/90 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign in to continue</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please sign in to open your enrolled quiz and see your saved progress.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-accent" />
          <span>Loading your quiz...</span>
        </div>
      </div>
    );
  }

  if (!activity || !quiz) {
    return (
      <div className="min-h-screen bg-background text-foreground px-4 py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-card/80 p-8 text-center backdrop-blur-xl">
          <AlertCircle className="h-12 w-12 text-amber-400" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Quiz not found</h1>
            <p className="text-muted-foreground">
              We could not find this activity in your enrolled list. Open the activities page and start one of the programming quizzes first.
            </p>
          </div>
          <Button onClick={() => router.push("/activity")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to activities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/activity")}
            className="border-border bg-card/70 backdrop-blur-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <ShareButton />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <Card className="border-border bg-card/90 backdrop-blur-xl">
            <CardHeader className="space-y-4 border-b border-border/60">
              <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-accent">
                  Programming
                </span>
                <span className="rounded-full border border-border px-3 py-1">
                  College
                </span>
                <span className="rounded-full border border-border px-3 py-1">
                  {quiz.timeLimit} sec
                </span>
              </div>

              <div className="space-y-2">
                <CardTitle className="text-3xl sm:text-4xl">{quiz.title}</CardTitle>
                <p className="max-w-3xl text-muted-foreground">
                  Test your college-level programming knowledge with focused questions on language fundamentals, syntax, and core concepts.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1">
                  <Clock className="h-4 w-4 text-accent" />
                  {Math.round(quiz.timeLimit / 60)} min quiz
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1">
                  <GraduationCap className="h-4 w-4 text-accent" />
                  {quiz.level}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-background/60 px-3 py-1">
                  <Trophy className="h-4 w-4 text-accent" />
                  {quiz.questions.length} questions
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-6">
              {quiz.questions.map((question, index) => {
                const selectedAnswer = answers[question.id];
                const isCorrect = submitted && selectedAnswer === question.answer;
                const isIncorrect = submitted && selectedAnswer !== undefined && selectedAnswer !== question.answer;

                return (
                  <div
                    key={question.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      isCorrect
                        ? "border-emerald-500/40 bg-emerald-500/10"
                        : isIncorrect
                          ? "border-red-500/40 bg-red-500/10"
                          : "border-border bg-background/40"
                    }`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                          Question {index + 1}
                        </p>
                        <h3 className="text-lg font-semibold leading-snug">
                          {question.question}
                        </h3>
                      </div>
                      {submitted && (
                        <div className="mt-1 flex items-center gap-2 text-sm font-medium">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                              Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <Circle className="h-4 w-4" />
                              Review
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswer === optionIndex;
                        const showCorrect = submitted && optionIndex === question.answer;
                        const showWrong = submitted && isSelected && optionIndex !== question.answer;

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleSelect(question.id, optionIndex)}
                            className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                              showCorrect
                                ? "border-emerald-500 bg-emerald-500/15 text-emerald-50"
                                : showWrong
                                  ? "border-red-500 bg-red-500/15 text-red-50"
                                  : isSelected
                                    ? "border-accent bg-accent/15 text-foreground"
                                    : "border-border bg-card/70 text-muted-foreground hover:border-accent/40 hover:text-foreground"
                            }`}
                          >
                            <span className="block text-sm font-medium">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleSubmit}
                  className="bg-gradient-to-r from-accent to-purple-500 text-white"
                  disabled={submitted}
                >
                  Submit Quiz
                </Button>
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="border-border bg-background/50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border bg-card/90 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-xl">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border bg-background/50 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Answered</span>
                    <span className="font-semibold text-foreground">
                      {Object.keys(answers).length}/{quiz.questions.length}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-accent to-purple-500"
                      style={{
                        width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {submitted && (
                  <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-6 w-6 text-accent" />
                      <div>
                        <p className="text-sm text-muted-foreground">Your score</p>
                        <p className="text-3xl font-bold">{percentage}%</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      You answered {score} out of {quiz.questions.length} questions correctly.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-border bg-background/50 p-4">
                  <p className="text-sm font-semibold text-foreground">Quiz tips</p>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>• Read each option carefully before choosing.</li>
                    <li>• Submit once you have reviewed every answer.</li>
                    <li>• Restart anytime to try for a better score.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
