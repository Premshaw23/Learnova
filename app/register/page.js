"use client";
import { useState } from "react";
import { Home } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFileUrl(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("rollNo", rollNo);
    formData.append("email", email);
    formData.append("photo", photo);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setFileUrl(data.fileUrl);
        setName("");
        setRollNo("");
        setEmail("");
        setPhoto(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-start bg-gradient-to-r p-5 relative min-h-screen">
      {/* Home Button */}
      <Link href="/">
        <button className=" p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 transition-colors">
          <Home className="w-5 h-5" />
        </button>
      </Link>

      <div className="w-full max-w-5xl mt-12 flex flex-col md:flex-row bg-white rounded-2xl shadow-xl p-8 gap-8">
        {/* Form */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-blue-700 text-center mb-6">
            Register New User
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Roll Number
              </label>
              <input
                type="text"
                placeholder="Enter roll number"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Upload Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                required
                className="w-full"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Register
            </button>
          </form>

          {error && (
            <div className="text-red-600 text-center font-medium mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Uploaded Image */}
        {fileUrl && (
          <div className="flex-1 flex flex-col items-center justify-start">
            <p className="text-green-600 font-semibold text-center mb-2">
              Registration Successful!
            </p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors mb-4"
            >
              View Uploaded Photo
            </a>
            <img
              src={fileUrl}
              alt="Uploaded"
              className="w-full max-w-sm rounded-lg shadow"
            />
          </div>
        )}
      </div>
    </div>
  );
}
