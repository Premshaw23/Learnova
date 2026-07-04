"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, ArrowRight, Zap } from "lucide-react";

const Block = ({
  title,
  description,
  onButton1Click,
  onButton2Click,
  button1title,
  button2title,
}) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border bg-card">
      <CardHeader className="pb-4">
        <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
          {title.includes("1") ? (
            <Activity className="w-6 h-6 text-accent" />
          ) : (
            <Zap className="w-6 h-6 text-accent" />
          )}
        </div>
        <CardTitle className="text-lg font-semibold text-card-foreground group-hover:text-accent transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col gap-2 pt-4">
        <Button
          onClick={onButton1Click}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          {button1title}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          onClick={onButton2Click}
          variant="outline"
          className="w-full border-border hover:bg-accent hover:text-accent-foreground bg-transparent"
          size="sm"
        >
          {button2title}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default Block;
