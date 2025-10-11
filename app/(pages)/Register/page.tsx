"use client";
import React, { useState } from "react";
import { EyeClosed, EyeIcon } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { motion } from "framer-motion";

// ✅ تعريف Schema
const schema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Page() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const res = await axios.post("https://vqr-741l.vercel.app/api/users/register", data);

      if (res.data) {
        localStorage.setItem("user", JSON.stringify(res));
        toast.success("Registration successful ✅");
        router.push("/"); // 👈 أفضل من window.location.href
      } else {
        toast.error("Registration failed ❌");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Something went wrong ❌");
    }
  };

  return (
    <motion.div
     initial={{ opacity: 0, y: -100 }}
      transition={{ duration: 1 }}
      animate={{ opacity: 1, y: 0 }}
    >
    <form
      className="m-auto flex flex-  h-screen justify-center items-center text-white"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col bg-black/10 gap-4 max-w-md mx-auto mt-10 backdrop-blur-3xl w-full border-2 border-amber-100/20 shadow-2xl px-10 py-5 rounded-4xl">
        <h1 className="text-2xl font-bold text-center">Register</h1>

        {/* Name */}
        <input
          type="text"
          placeholder="Enter your name"
          className="flex items-center border border-gray-300/10 shadow-md shadow-blue-950 outline-0 p-2 rounded-md "
          {...register("name")}
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}

        {/* Phone */}
        <input
          type="text"
          placeholder="Enter your phone"
          className="flex items-center border border-gray-300/10 shadow-md shadow-blue-950 outline-0 p-2 rounded-md "
          {...register("phone")}
        />
        {errors.phone && <p className="text-red-500">{errors.phone.message}</p>}

        {/* Email */}
        <input
          type="text"
          placeholder="Enter your email"
          className="flex items-center border border-gray-300/10 shadow-md shadow-blue-950 outline-0 p-2 rounded-md "
          {...register("email")}
        />
        {errors.email && <p className="text-red-500">{errors.email.message}</p>}

        {/* Password */}
        <div className=" flex items-center border border-gray-300/40 shadow-md shadow-blue-950 outline-0 p-2 rounded-md ">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="border-none outline-none flex-1"
          />
          {showPassword ? (
            <EyeIcon
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer"
            />
          ) : (
            <EyeClosed
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer"
            />
          )}
        </div>
        {errors.password && (
          <p className="text-red-500">{errors.password.message}</p>
        )}

        {/* Submit */}
        <button className="tracking-[3px] bg-gradient-to-r from-black/10 to-violet-800/10 p-2 rounded-4xl shadow-stone-800 hover:translate-y-2 shadow-md hover:shadow-2xl duration-500">
          Register
        </button>

        {/* Links */}
        <p>
          Already have an account?{" "}
          <Link href="/Login" className="text-blue-500">
            Login
          </Link>
        </p>
      </div>
    </form></motion.div>
  );
}
