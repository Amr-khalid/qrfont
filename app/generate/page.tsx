"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import Link from "next/link";

// ✅ 1. تعريف الـ Schema للتحقق من المدخلات
const formSchema = z.object({
  studentId: z.string().min(1, "Student ID مطلوب"),
  name: z.string().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل"),
  section: z.string().optional(),
  email: z.string().email("الرجاء إدخال إيميل صالح"),
  type: z.string(),
  team: z.string().optional(),
  userId: z.string().optional(),
  course: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function GeneratePage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [userId, setUser] = useState<string>("");

  // ✅ قراءة userId من localStorage
useEffect(() => {
  
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      const id = parsed?.data?.data?._id || "";
      setUser(id);
    }
  
}, []);


  // ✅ تهيئة النموذج
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { type: "attendance" },
  });

  // ✅ 3. عند الإرسال
  const onSubmit = async (data: FormData) => {
    setStatus("جارٍ توليد الكود...");
    setQrDataUrl(null);

    try {
      // نضيف userId داخل البيانات قبل الإرسال
      const payload = { ...data, userId };

      // توليد الـ QR
      const res = await axios.post(
        "https://vqr-741l.vercel.app/api/qr/generate",
        payload
      );

      // إضافة الطالب لقائمة المستخدم
      

      setStatus(res.data.status);
      setQrDataUrl(res.data.qrDataUrl);
      toast.success("تم إرسال QR إلى البريد الإلكتروني بنجاح 🎉");
      reset();
    } catch (err: any) {
      console.error(err);
      toast.error("❌ حدث خطأ أثناء إنشاء أو إرسال الـ QR");
      setStatus("❌ حدث خطأ أثناء إنشاء أو إرسال الـ QR");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 flex flex-col items-center"
    >
      <h2 className="text-xl mb-4 font-bold">Generate QR</h2>

      {/* ✅ 4. النموذج */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-3 max-w-md w-full flex flex-col"
      >
        {/* userId hidden */}
        <input type="hidden" {...register("userId")} defaultValue={userId} />

        {/* Student ID */}
        <input
          className="p-2 bg-black/10 rounded-[20px] shadow-black shadow-md text-white"
          placeholder="Student ID"
          {...register("studentId")}
        />
        {errors.studentId && (
          <p className="text-red-500 text-sm">{errors.studentId.message}</p>
        )}

        {/* Name */}
        <input
          className="p-2 bg-black/10 rounded-[20px] shadow-black shadow-md text-white"
          placeholder="Name"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}

        {/* Section */}
        <input
          className="p-2 bg-black/10 rounded-[20px] shadow-black shadow-md text-white"
          placeholder="Section"
          {...register("section")}
        />

        {/* Email */}
        <input
          className="p-2 ring-1 ring-inset ring-violet-700/80 border-white/40 border-2 bg-black/10 rounded-[20px] shadow-black shadow-md text-white"
          placeholder="Email"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}

        {/* Course */}
        <input
          className="p-2 bg-black/10 rounded-[20px] shadow-black shadow-md text-white"
          placeholder="Course"
          {...register("course")}
        />


        {/* Type */}
        <select
          className="bg-black/100 rounded-[20px] shadow-black shadow-md p-2 ring-1 ring-inset ring-white/10 text-white"
          {...register("type")}
        >
          <option value="attendance">حضور</option>
          <option value="exam">دخول امتحان</option>
          <option value="assignment">تسليم واجب</option>
        </select>

        {/* Team */}
        <select
          className="bg-black/100 rounded-[20px] shadow-black shadow-md p-2 ring-1 ring-inset ring-white/10 text-white"
          {...register("team")}
        >
          <option value="الفرقة الأولى">الفرقة الأولى</option>
          <option value="الفرقة الثانية">الفرقة الثانية</option>
          <option value="الفرقة الثالثة">الفرقة الثالثة</option>
          <option value="الفرقة الرابعة">الفرقة الرابعة</option>
        </select>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-950/10 border border-violet-500/40 disabled:opacity-50 cursor-pointer text-white px-4 py-2 rounded-full shadow-md shadow-violet-500/50 hover:skew-y-1 hover:translate-y-2 transition-colors duration-300"
        >
          {isSubmitting ? "جاري التوليد..." : "توليد QR"}
        </button>
      </form>

      {/* ✅ الحالة */}
      {status && (
        <p className="mt-4 animate-pulse text-sm font-bold px-3 py-2 rounded text-white">
          {status}
        </p>
      )}
 <Link href="/excel" className="fixed left-0 top-0 capitalize font-semibold underline text-violet-200 duration-300 hover:text-violet-600">
          imoprt from excel
          </Link>
      {/* ✅ عرض QR */}
      {qrDataUrl && (
        <div className="mt-6 text-center">
          <h3 className="font-bold mb-2">QR</h3>
          <img
            src={qrDataUrl}
            alt="qr"
            className="w-48 h-48 mx-auto border border-gray-400 rounded-lg"
          />
          <a
            href={qrDataUrl}
            download={`qr-${Date.now()}.png`}
            className="block mt-2 text-blue-400 underline"
          >
            تحميل
          </a>
         
        </div>
      )}
    </motion.div>
  );
}
