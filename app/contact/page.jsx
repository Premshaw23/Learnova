
"use client";
import { Navbar } from '@/components/Navbar'
import React from 'react'
import Link from 'next/link';
import { useState } from 'react';
export default function Contact(){
  const [form,setForm] = useState({Name: "",Email: "",Message: ""});
  const handlechange = (e)=>{
    setForm((currform)=>({
      ...currform,[e.target.name]:[e.target.value],
    }))
  }




  
  const handlesubmit=async (e)=>{
    e.preventDefault();
    setForm({Name:"",Email:"",Message:""})
  }
  return (
    <div>
        <Navbar/>
           <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
        <p className="text-gray-600 mb-6">
          We’d love to hear from you! Fill out the form and we’ll get back to you as soon as possible.
        </p>

        {/* Contact Form */}
        <form className="space-y-4" onSubmit={handlesubmit}>
          <div>
            <label className="block text-gray-700 mb-1"></label>
            <input
               onChange={handlechange}
              type="text"
              placeholder="Your name"
              name='Name'
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.Name}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
            value={form.Email}
            onChange={handlechange}
              type="email"
              name='Email'
              placeholder="you@example.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Message</label>
            <textarea
            value={form.Message}
            onChange={handlechange}
              rows="4"
              name='Message'
              placeholder="Write your message here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Send Message
          </button>
        </form>
      </div>

      {/* Contact Info Section */}
      <div className="max-w-2xl w-full mt-8 text-center">
        <p className="text-gray-700">
          📧 Email: <a href="mailto:support@yourdomain.com" className="text-indigo-600">learnova@gmail.com</a>
        </p>
        <p className="text-gray-700">📱 Phone: +91-93102438XX</p>
        <p className="text-gray-700">📍 Address: New Delhi, India</p>

        {/* Social Links */}
        <div className="flex justify-center space-x-4 mt-4">
          <Link href='https://www.x.com' className="text-gray-600 hover:text-indigo-600"> 🌐 Twitter</Link>
          <Link href="https://www.linkedin.com" className="text-gray-600 hover:text-indigo-600"> 🔗 LinkedIn</Link>
          <Link href="https://www.facebook.com" className="text-gray-600 hover:text-indigo-600"> 📘 Facebook</Link>
        </div>
      </div>
    </div>
    </div>
  )
}

