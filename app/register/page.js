"use client";
import { useState } from "react";

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
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Enter name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Enter roll number"
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border p-2 rounded w-full"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setPhoto(e.target.files[0])}
          required
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Register
        </button>
      </form>

      {error && <div className="text-red-600">{error}</div>}

      {fileUrl && (
        <div className="mt-4 space-y-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded"
          >
            View Uploaded Photo
          </a>
          <img src={fileUrl} alt="Uploaded" className="mt-2 max-w-xs rounded" />
        </div>
      )}
    </div>
  );
}
