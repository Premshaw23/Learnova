
"use client";
import { Navbar } from '@/components/Navbar'
import React from 'react'
import Block from '@/components/Block';
import { useRouter } from 'next/navigation';
const Activity = () => {
  const router = useRouter();
   const blocks = [
    {
      title: "Functional Block 1",
      description: "This block does amazing things.",
      onButton1Click: () =>{
          router.push("/");
      },
      onButton2Click: () => router.push("/register"),
      button1title:"title1 ",
      button2title:"title2 2"
    },
    {
      title: "Functional Block 2",
      description: "Handles important tasks smoothly.",
      onButton1Click: () => alert("Block 2 - Button 1"),
      onButton2Click: () => alert("Block 2 - Button 2"),
      button1title:"buttion1 ",
      button2title:"button 2 title"
    },
    // ...add more blocks
  ];
  return (
    <div>
        <Navbar/>
        <div className="min-h-screen flex flex-col bg-gray-50">
      <h1 className="text-4xl font-bold text-center mt-10">Activities</h1>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-12 max-w-7xl mx-auto">
        {blocks.map((block, i) => (
          <Block
            key={i}
            title={block.title}
            description={block.description}
            onButton1Click={block.onButton1Click}
            onButton2Click={block.onButton2Click}
            buttion1title={block.button1title}
            buttion2title={block.button2title}
          />
        ))}
      </div>
    </div>

    </div>
  )
}

export default Activity
