"use client";
import axios from "axios";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
} from "recharts";

interface StudentRecord {
  studentId: string;
  name: string;
  section: string;
  email: string;
  team: string;
  attendance: number;
  scannedAt: string;
  course?: string;
}

export default function AttendanceDashboard() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  const fetchRecords = async () => {
    if (!studentId.trim()) {
      setError("الرجاء إدخال رقم الطالب أولًا");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.get("https://vqr-741l.vercel.app/api/all", {
        params: { studentId },
      });

      const arr = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.data)
        ? response.data.data
        : [];

      if (arr.length === 0) {
        setError("لا توجد بيانات لهذا الطالب");
      }

      setRecords(arr);
    } catch (error) {
      console.error("Error fetching records:", error);
      setError("حدث خطأ أثناء تحميل البيانات");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData =
    records.length > 0
      ? Object.values(
          records.reduce((acc: any, rec) => {
            const key = rec.course || "غير محدد";
            if (!acc[key]) acc[key] = { course: key, attendance: 0 };
            acc[key].attendance += rec.attendance;
            return acc;
          }, {})
        )
      : [];

  const totalStudents = records.length;
  const totalCourses = new Set(records.map((r) => r.course || "غير محدد")).size;
  const totalAttendance = records.reduce(
    (sum, r) => sum + (r.attendance || 0),
    0
  );

  // Corrected and enhanced color palette
  const colors = [
    "#60A5FA", // Blue
    "#34D399", // Green
    "#FBBF24", // Yellow
    "#F472B6", // Pink
    "#A78BFA", // Purple
    "#2DD4BF", // Teal
    "#F87171", // Red
    "#4ADE80", // Lime
    "#818CF8", // Indigo
    "#FDBA74", // Orange
  ];

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">
        لوحة إحصائيات الحضور
      </h2>

      {/* 🔹 إدخال رقم الطالب */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-8">
        <input
          type="text"
          placeholder="أدخل رقم الطالب"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fetchRecords();
          }}
          className="bg-transparent rounded-b-2xl shadow-black shadow-2xl mb-2 w-full sm:w-1/3 p-2 rounded-lg border border-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          onClick={fetchRecords}
          className="bg-blue-900/10 shadow-black w-full sm:w-auto flex justify-center rounded-full hover:bg-blue-700/20 hover:scale-105 transition-all duration-200 text-white px-4 py-2 shadow-md"
        >
          <Search size={30} />
        </button>
      </div>

      {/* ⚠️ رسالة الخطأ */}
      {error && <p className="text-center text-red-400 mb-4">{error}</p>}

      {/* ⏳ تحميل */}
      {loading && (
        <p className="text-center text-gray-300">⏳ جاري تحميل البيانات...</p>
      )}

      {/* ✅ عرض البيانات */}
      {!loading && records.length > 0 && (
        <>
          {/* الكروت الإحصائية */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-900/20 p-4 rounded-xl text-center shadow-lg hover:bg-blue-800/30 hover:scale-105 transition-all duration-200">
              <h3 className="text-lg font-semibold">عدد السجلات</h3>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>

            <div className="bg-green-900/20 p-4 rounded-xl text-center shadow-lg hover:bg-green-800/30 hover:scale-105 transition-all duration-200">
              <h3 className="text-lg font-semibold">عدد المواد</h3>
              <p className="text-2xl font-bold">{totalCourses}</p>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-xl text-center shadow-lg hover:bg-purple-800/30 hover:scale-105 transition-all duration-200">
              <h3 className="text-lg font-semibold">إجمالي الحضور</h3>
              <p className="text-2xl font-bold">{totalAttendance}</p>
            </div>
          </div>

          {/* جدول البيانات */}
          <div className="overflow-x-auto mb-10">
            <table className="table-auto w-full text-sm text-white text-center">
              <thead className="bg-gray-800/40">
                <tr>
                  <th className="p-2">Student ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Section</th>
                  <th className="p-2">Course</th>
                  <th className="p-2">Attendance</th>
                  <th className="p-2">Team</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, index) => (
                  <tr
                    key={index} // Using index for a unique key
                    className="hover:bg-blue-800/20 transition-all duration-200 hover:scale-[1.01]"
                  >
                    <td className="p-2">{rec.studentId}</td>
                    <td className="p-2">{rec.name}</td>
                    <td className="p-2">{rec.section}</td>
                    <td className="p-2">{rec.course || "N/A"}</td>
                    <td className="p-2">{rec.attendance}</td>
                    <td className="p-2">{rec.team}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* الرسم البياني */}
          <div className="bg-white/5 p-4 rounded-xl shadow-lg hover:bg-white/10 transition-all duration-200">
            <h3 className="text-center text-lg mb-4">
              📈 نسبة الحضور لكل مادة
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height={400}
                className="bg-black/20 shadow-md shadow-black rounded-xl p-3"
              >
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#333" />
                  <XAxis dataKey="course" stroke="#fff" />
                  <YAxis
                    stroke="#fff"
                    allowDecimals={false}
                    tickFormatter={(value) => String(Math.round(value))} // ✅ FIX: Convert number to string
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f1f1f",
                      borderRadius: "10px",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    itemStyle={{ color: "#00ffcc" }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                  />
                  <Legend wrapperStyle={{ color: "#fff" }} />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    fill="rgba(120, 120, 255, 0.4)"
                    stroke="rgba(150, 150, 255, 0.8)"
                  />
                  <Bar dataKey="attendance" barSize={35} radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Bar>
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#fff"
                    strokeWidth={2}
                    dot={{ fill: "#fff", r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-400">لا توجد بيانات لعرضها</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
