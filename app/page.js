
"use client";
import { Navbar } from "@/components/Navbar";
import SplitText from "@/components/SplitText";
import DarkVeil from "@/components/DarkVeil";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Target, Heart, Lightbulb, GraduationCap } from "lucide-react";

export default function AboutPage() {
  const handleAnimationComplete = () =>{
    console.log("animation completed ");
  }
  return (
    <>
    <div className="fixed inset-0 -z-10">
    <DarkVeil />
    </div>
    <div className="min-h-screen absolute z-50 top-0 w-full h-full">
      <Navbar />
      <section className="py-20 px-4 sm:px-6 lg:px-8 flex justify-center">
      <SplitText
          text="About "
          className="text-2xl max-w-4xl mx-autotext-4xl md:text-5xl font-bold text-white mb-6 text-balance text-center"
          delay={100}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: -1, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />
        <div className="w-5"></div>
        <SplitText
          text="Learnova"
          className="text-2xl max-w-4xl text-accent mx-autotext-4xl md:text-5xl font-bold mb-6 text-balance text-center"
          delay={200}
          duration={0.5}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
        />
      {/* Hero Section */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted"> */}
        {/* <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            About <span className="text-accent">Learnova</span>
          </h1>
          <p className="text-xl text-muted-foreground text-pretty">
            We're revolutionizing educational administration with intelligent
            curriculum planning and automated attendance management. Empowering
            institutions to focus on what matters most - student success.
          </p>
        </div> */}
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-purple-400 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-amber-50 mb-6 leading-relaxed">
                At Learnova, we believe that effective educational
                administration is the foundation of student success. Our
                platform streamlines curriculum planning and attendance
                tracking, giving educators more time to focus on teaching and
                student engagement.
              </p>
              <p className="text-lg text-purple-100 leading-relaxed">
                We're committed to providing educational institutions with the
                tools they need to operate efficiently, make data-driven
                decisions, and create better learning outcomes for all students.
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg h-96 flex items-center  border border-purple-500 justify-center">
              <div className="text-center ">
                <GraduationCap className="h-24 w-24 text-purple-50 mx-auto mb-4" />
                <p className="text-lg font-semibold text-white">
                  Empowering Educational Excellence
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-100 mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-red-100 max-w-2xl mx-auto">
              These principles guide our development and shape the solutions we
              create for educational institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-border hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-foreground">Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  We streamline administrative processes to reduce workload and
                  eliminate redundancy, allowing educators to focus on teaching.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Heart className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-foreground">
                  Student-Centered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Every feature is designed with student success in mind,
                  providing insights that help institutions support their
                  learners better.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Lightbulb className="h-8 w-8 text-accent" />
                </div>
                <CardTitle className="text-foreground">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  We leverage cutting-edge technology and AI to create
                  intelligent solutions that adapt to the evolving needs of
                  modern education.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-100">
              The educators and technologists behind Learnova's innovation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-border">
              <CardContent className="pt-6">
                <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-accent">AS</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Alex Smith
                </h3>
                <p className="text-accent font-medium mb-3">CEO & Founder</p>
                <p className="text-muted-foreground text-sm">
                  Former school administrator with 15 years of experience in
                  educational technology and institutional management systems.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border">
              <CardContent className="pt-6">
                <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-accent">MJ</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Maria Johnson
                </h3>
                <p className="text-accent font-medium mb-3">Head of Product</p>
                <p className="text-muted-foreground text-sm">
                  Curriculum specialist and former teacher who understands the
                  daily challenges of educational administration and student
                  tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border">
              <CardContent className="pt-6">
                <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-accent">DL</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  David Lee
                </h3>
                <p className="text-accent font-medium mb-3">CTO</p>
                <p className="text-muted-foreground text-sm">
                  Technology leader specializing in educational software
                  architecture and scalable institutional management platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-accent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-accent-foreground mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-accent-foreground/90">
              Transforming educational administration across institutions
              worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent-foreground mb-2">
                500+
              </div>
              <p className="text-accent-foreground/90">Institutions</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent-foreground mb-2">
                100K+
              </div>
              <p className="text-accent-foreground/90">Students Tracked</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent-foreground mb-2">
                60%
              </div>
              <p className="text-accent-foreground/90">Time Saved</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-accent-foreground mb-2">
                98%
              </div>
              <p className="text-accent-foreground/90">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
