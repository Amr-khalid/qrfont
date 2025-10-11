"use client";
import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { BsQrCode } from "react-icons/bs";
import { RiQrScan2Line } from "react-icons/ri";
import { FaFileDownload } from "react-icons/fa";
import axios from "axios";
import toast from "react-hot-toast";
import { IoMdStats } from "react-icons/io";
import { CiLogout } from "react-icons/ci";

export default function Home() {  
   const [userId, setUser] = useState<string>("");
   const [user, setUsers] = useState<string>("");

    useEffect(() => {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = parsed?.data?.data?._id || "";
        setUser(id);
        setUsers(parsed?.data?.data?.name);
      }
    }, []);
  const handleDownload = async () => {
    if (!userId) {
      toast.error("يرجى تسجيل الدخول اولا");
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/api/export/excel`, {
        params: { userId }, // يضيف userId في الـ query string تلقائيًا
        responseType: "blob", // مهم جدًا علشان ينزل الملف كـ Blob
      });

      // 👇 تحويل Blob إلى رابط وتنزيل الملف
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `scans-${userId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("✅ تم تحميل ملف Excel بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("لا يوجد عناصر في الملف Excel");
    }
  };

   console.log(user);
   
 

  return (
    <div className="font-semibold mt-6 md:mt-0 grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {userId ? (
        <span className=" fixed top-0 left-0">Hello {user}</span>
      ) : (
        <Link href="/Login" className=" fixed top-0 left-0">
          Login
        </Link>
      )}
      {userId && <CiLogout className=" fixed bottom-0 left-0"  size={30} onClick={()=>{localStorage.removeItem("user");location.reload()}}/>}
      <Link
        href="/generate"
        className="flex flex-col  items-center animate-bouncee"
      >
        <BsQrCode size={80} className="colors" />
        Create QR
      </Link>

      <button
        onClick={handleDownload}
        className="flex flex-col items-center animate-bounce"
      >
        <FaFileDownload
          size={80}
          color="white"
          className="animate-bounce hue"
        />
        تحميل Excel
      </button>

      <Link href="/scan" className="flex flex-col items-center">
        <RiQrScan2Line size={100} color="white" className="pings" />
        Scan QR
      </Link>

      <button
        onClick={async () => {
          try {
            await axios.post("http://localhost:5000/api/drop", {
              id: JSON.parse(localStorage.getItem("user") as string)?.data?.data
                ?._id,
            });
            toast.success("🗑️ تم حذف بيانات Excel بنجاح");
          } catch (err) {
            toast.error("لا يمكن حذف بيانات Excel حاليا");
          }
        }}
        className="font-bold fixed bottom-0 right-0 p-4 text-red-500"
      >
        drop excel
      </button>
      <Link href="/stats" className="flex flex-col items-center">
        <IoMdStats size={100} className=" ver" />
        Statistics
      </Link>
    </div>
  );
}
