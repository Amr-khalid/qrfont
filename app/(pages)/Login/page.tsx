"use client";
import React, { useState } from "react";

import { EyeClosed, EyeIcon } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import toast from "react-hot-toast";
import axios from "axios";

import  { motion as Motion} from "framer-motion";

export default function Page() {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [forgetshow, setforgetshow] = useState(false);
  const [resetShow, setresetShow] = useState(false);


  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const response = await axios.post(
        "https://vqr-741l.vercel.app/api/users/login",
        data
      );

      // ✅ السيرفر بيرجع object كامل (id, name, email, token, courses)
      const userData = response;
      console.log("UserData:", userData);

      // ✅ تحديث الريدكس

      // ✅ حفظ اليوزر كامل في localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Login successful ✅");
      window.location.href = "/";

    } catch (err) {
      toast.error("Login failed ❌");
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: -100 }}
      transition={{ duration: 1 }}
      animate={{ opacity: 1, y: 0 }}>
      <form
        className="m-auto flex flex-col  h-screen justify-center items-center text-white"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex bg-black/10 flex-col gap-4 max-w-md mx-auto mt-10 backdrop-blur-3xl w-full border-2 border-amber-100/20 shadow-2xl px-10 py-5 rounded-4xl">
          <h1 className="text-2xl font-bold text-center">Login</h1>

          {/* Email */}
          <input
            type="text"
            placeholder="Enter your email"
            className="border border-gray-300/10 shadow-md shadow-blue-950 outline-0 p-2 rounded-md"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500">{errors.email.message}</p>
          )}

          {/* Password */}
          <div className="flex items-center border border-gray-300/10 shadow-md shadow-blue-950 outline-0 p-2 rounded-md">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="border-0 outline-none flex-1  "
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
          <button className="bg-gradient-to-r from-black/10 to-violet-800/10 p-2 rounded-4xl shadow-stone-800 hover:translate-y-2 shadow-md hover:shadow-2xl duration-500">
            Login
          </button>

          {/* Links */}
          <b className="p-2 opacity-50">
            {/* forgot password?{" "}
            <span
              className="text-blue-500 cursor-pointer"
              onClick={() => {
                setforgetshow(true);
              }}
            >
              Click Here
            </span> */}
            <p>
              Don`t have an account?
              <Link href="/Register" className="text-blue-500">
                Register
              </Link>
            </p>
          </b>
        </div>
      </form>

      {/* Forget Password */}
      {forgetshow && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white/5 p-6 rounded-lg shadow-lg w-96">
            <h1>Enter your email to reset your password</h1>
            <input type="text" className="border p-2 rounded-md w-full" />
            <button
              className="w-full bg-gradient-to-r from-black/10 to-violet-800/10 p-2 rounded-4xl shadow-stone-800 hover:translate-y-2 shadow-md hover:shadow-2xl duration-500 mt-2"
              onClick={() => {
                setresetShow(true);
                setforgetshow(false);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Reset Password */}
      {resetShow && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 bg-opacity-50 flex items-center justify-center">
          <div className=" bg-white/5 p-6 rounded-lg shadow-lg w-96">
            <h1>Enter your code to reset your password</h1>
            <input type="text" className="border p-2 rounded-md w-full" />
            <h1>Enter your new password</h1>
            <input type="password" className="border p-2 rounded-md w-full" />
            <button
              className="w-full bg-gradient-to-r from-black/10 to-violet-800/10 p-2 rounded-4xl shadow-stone-800 hover:translate-y-2 shadow-md hover:shadow-2xl duration-500 mt-2"
              onClick={() => {
                setresetShow(false);
                setforgetshow(false);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </Motion.div>
  );
}
