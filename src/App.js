import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  BarChart3,
  UserPlus,
  CheckSquare,
  Trash2,
  Edit,
  Download,
  LogOut,
  LogIn,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBaLYbJKeqgUE89dKPmFAyQJIk_X8tCqJk",
  authDomain: "jnisis.firebaseapp.com",
  projectId: "jnisis",
  storageBucket: "jnisis.firebasestorage.app",
  messagingSenderId: "597624905955",
  appId: "1:597624905955:web:94cba5f2a423f3875da5d6",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginMode, setLoginMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [activeTab, setActiveTab] = useState("attendance");
  const [youths, setYouths] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [showAddYouth, setShowAddYouth] = useState(false);
  const [editingYouth, setEditingYouth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newYouth, setNewYouth] = useState({
    name: "",
    age: "",
    phone: "",
    address: "",
    birthdate: "",
    group: "11-14",
  });
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedYouths, setSelectedYouths] = useState([]);

  const groups = ["11-14", "15-18", "19-22", "23-40"];
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Agregar este useEffect después del useEffect de autenticación existente
  useEffect(() => {
    if (user) {
      // Timer para cerrar sesión después de 15 minutos (900000 ms)
      const logoutTimer = setTimeout(() => {
        handleLogout();
        alert("Tu sesión ha expirado después de 15 minutos");
      }, 900000); // 15 minutos = 15 * 60 * 1000 ms

      // Limpiar el timer cuando el usuario cierre sesión o el componente se desmonte
      return () => clearTimeout(logoutTimer);
    }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Error en login:", error);
      if (error.code === "auth/user-not-found") {
        alert("Usuario no encontrado. Por favor regístrate.");
      } else if (error.code === "auth/wrong-password") {
        alert("Contraseña incorrecta.");
      } else if (error.code === "auth/invalid-email") {
        alert("Email inválido.");
      } else if (error.code === "auth/invalid-credential") {
        alert("Credenciales inválidas. Verifica tu email y contraseña.");
      } else {
        alert("Error al iniciar sesión: " + error.message);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      alert("Usuario registrado exitosamente");
    } catch (error) {
      console.error("Error en registro:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("Este email ya está registrado. Intenta iniciar sesión.");
      } else if (error.code === "auth/invalid-email") {
        alert("Email inválido.");
      } else {
        alert("Error al registrar: " + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setYouths([]);
      setAttendances([]);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const loadData = async (userId) => {
    setLoading(true);
    try {
      // Cargar jóvenes del usuario actual
      const youthsQuery = query(
        collection(db, "youths"),
        where("userId", "==", userId)
      );
      const youthsSnapshot = await getDocs(youthsQuery);
      const youthsData = youthsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setYouths(youthsData);

      // Cargar asistencias del usuario actual
      const attendancesQuery = query(
        collection(db, "attendances"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const attendancesSnapshot = await getDocs(attendancesQuery);
      const attendancesData = attendancesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAttendances(attendancesData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar datos de Firebase");
    } finally {
      setLoading(false);
    }
  };

  const handleAddYouth = async () => {
    if (!newYouth.name || !newYouth.age) {
      alert("Por favor completa al menos el nombre y edad");
      return;
    }

    try {
      const youth = {
        ...newYouth,
        age: parseInt(newYouth.age),
        userId: user.uid, // Agregar ID del usuario
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "youths"), youth);
      const newYouthWithId = { id: docRef.id, ...youth };

      setYouths([...youths, newYouthWithId]);
      setNewYouth({
        name: "",
        age: "",
        phone: "",
        address: "",
        birthdate: "",
        group: "11-14",
      });
      setShowAddYouth(false);
      alert("Joven agregado exitosamente");
    } catch (error) {
      console.error("Error agregando joven:", error);
      alert("Error al agregar joven");
    }
  };

  const handleEditYouth = (youth) => {
    setEditingYouth(youth);
    setNewYouth({
      name: youth.name,
      age: youth.age.toString(),
      phone: youth.phone,
      address: youth.address,
      birthdate: youth.birthdate,
      group: youth.group,
    });
    setShowAddYouth(true);
  };

  const handleUpdateYouth = async () => {
    try {
      const youthRef = doc(db, "youths", editingYouth.id);
      const updatedData = {
        ...newYouth,
        age: parseInt(newYouth.age),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(youthRef, updatedData);

      const updatedYouths = youths.map((y) =>
        y.id === editingYouth.id
          ? { id: editingYouth.id, ...updatedData, userId: user.uid }
          : y
      );
      setYouths(updatedYouths);

      setNewYouth({
        name: "",
        age: "",
        phone: "",
        address: "",
        birthdate: "",
        group: "11-14",
      });
      setShowAddYouth(false);
      setEditingYouth(null);
      alert("Joven actualizado exitosamente");
    } catch (error) {
      console.error("Error actualizando joven:", error);
      alert("Error al actualizar joven");
    }
  };

  const handleDeleteYouth = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este joven?")) return;

    try {
      await deleteDoc(doc(db, "youths", id));
      setYouths(youths.filter((y) => y.id !== id));
      alert("Joven eliminado exitosamente");
    } catch (error) {
      console.error("Error eliminando joven:", error);
      alert("Error al eliminar joven");
    }
  };

  const handleSaveAttendance = async () => {
    if (selectedYouths.length === 0) {
      alert("Selecciona al menos un joven");
      return;
    }

    try {
      const attendance = {
        date: attendanceDate,
        youths: selectedYouths.map((id) => {
          const youth = youths.find((y) => y.id === id);
          return { id, name: youth.name, group: youth.group };
        }),
        userId: user.uid, // Agregar ID del usuario
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "attendances"), attendance);
      const newAttendance = { id: docRef.id, ...attendance };

      setAttendances([newAttendance, ...attendances]);
      setSelectedYouths([]);
      alert("Asistencia guardada correctamente");
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      alert("Error al guardar asistencia");
    }
  };

  const toggleYouthSelection = (id) => {
    setSelectedYouths((prev) =>
      prev.includes(id) ? prev.filter((yid) => yid !== id) : [...prev, id]
    );
  };

  const getChartData = () => {
    const dateMap = {};
    attendances.forEach((att) => {
      if (!dateMap[att.date]) {
        dateMap[att.date] = {
          date: att.date,
          "11-14": 0,
          "15-18": 0,
          "19-22": 0,
          "23-40": 0,
          total: 0,
        };
      }
      att.youths.forEach((youth) => {
        dateMap[att.date][youth.group]++;
        dateMap[att.date].total++;
      });
    });
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  const getGroupTotals = () => {
    const totals = { "11-14": 0, "15-18": 0, "19-22": 0, "23-40": 0 };
    attendances.forEach((att) => {
      att.youths.forEach((youth) => {
        totals[youth.group]++;
      });
    });
    return Object.entries(totals).map(([group, count]) => ({ group, count }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportToExcel = () => {
    try {
      const headers = [
        "Nombre",
        "Edad",
        "Grupo",
        "Celular",
        "Fecha de Nacimiento",
        "Dirección",
      ];
      const rows = youths.map((youth) => [
        youth.name,
        youth.age,
        youth.group + " años",
        youth.phone || "N/A",
        youth.birthdate ? formatDate(youth.birthdate) : "N/A",
        youth.address || "N/A",
      ]);

      let csvContent = headers.join(";") + "\n";
      rows.forEach((row) => {
        csvContent += row.map((cell) => `"${cell}"`).join(";") + "\n";
      });

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `directorio_jovenes_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("¡Archivo descargado exitosamente! Ábrelo con Excel.");
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Hubo un error al exportar. Por favor intenta de nuevo.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Sistema JNI</h1>
            <p className="text-gray-600 mt-2">Gestión de Asistencia Juvenil</p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLoginMode("login")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                loginMode === "login"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setLoginMode("register")}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                loginMode === "register"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={loginMode === "login" ? handleLogin : handleRegister}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              {loginMode === "register" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                {loginMode === "login" ? "Iniciar Sesión" : "Registrarse"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-700">
            Cargando datos desde Firebase...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="w-8 h-8" />
                  Sistema de Asistencia - Grupo de Jóvenes
                </h1>
                <p className="mt-2 opacity-90">
                  Gestiona asistencias con Firebase ☁️
                </p>
                <p className="text-sm mt-1 opacity-75">Usuario: {user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>

          <div className="flex border-b bg-gray-50">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === "attendance"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              Tomar Asistencia
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === "stats"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab("directory")}
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeTab === "directory"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-5 h-5" />
              Directorio
            </button>
          </div>

          <div className="p-6">
            {activeTab === "attendance" && (
              <div>
                <div className="mb-6 flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveAttendance}
                    className="ml-auto bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Guardar Asistencia
                  </button>
                </div>

                {groups.map((group) => {
                  const groupYouths = youths.filter((y) => y.group === group);
                  if (groupYouths.length === 0) return null;

                  return (
                    <div key={group} className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 bg-blue-50 p-3 rounded-lg">
                        Grupo {group} años ({groupYouths.length} jóvenes)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {groupYouths.map((youth) => (
                          <label
                            key={youth.id}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedYouths.includes(youth.id)
                                ? "bg-blue-50 border-blue-500 shadow-md"
                                : "bg-white border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedYouths.includes(youth.id)}
                              onChange={() => toggleYouthSelection(youth.id)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-semibold text-gray-800">
                                {youth.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {youth.age} años
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {youths.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No hay jóvenes registrados aún.</p>
                    <p className="text-sm">
                      Ve a la pestaña "Directorio" para agregar jóvenes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Estadísticas de Asistencia
                </h2>

                {attendances.length > 0 ? (
                  <>
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Asistencia por Fecha
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={getChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={formatDate} />
                          <YAxis />
                          <Tooltip labelFormatter={formatDate} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="11-14"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="11-14 años"
                          />
                          <Line
                            type="monotone"
                            dataKey="15-18"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="15-18 años"
                          />
                          <Line
                            type="monotone"
                            dataKey="19-22"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="19-22 años"
                          />
                          <Line
                            type="monotone"
                            dataKey="23-40"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            name="23-40 años"
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#6366f1"
                            strokeWidth={3}
                            name="Total"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Total de Asistencias por Grupo
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={getGroupTotals()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="group"
                            label={{
                              value: "Grupos de Edad",
                              position: "insideBottom",
                              offset: -5,
                            }}
                          />
                          <YAxis
                            label={{
                              value: "Total Asistencias",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="count"
                            fill="#6366f1"
                            name="Asistencias"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">
                        Historial de Asistencias
                      </h3>
                      <div className="space-y-4">
                        {attendances.map((att) => (
                          <div
                            key={att.id}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                          >
                            <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <Calendar className="w-5 h-5" />
                              {formatDate(att.date)} - {att.youths.length}{" "}
                              jóvenes presentes
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                              {groups.map((group) => {
                                const groupAttendees = att.youths.filter(
                                  (y) => y.group === group
                                );
                                if (groupAttendees.length === 0) return null;
                                return (
                                  <div
                                    key={group}
                                    className="bg-white rounded p-2"
                                  >
                                    <div className="font-semibold text-gray-700 mb-1">
                                      Grupo {group}:
                                    </div>
                                    <div className="text-gray-600">
                                      {groupAttendees
                                        .map((y) => y.name)
                                        .join(", ")}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">
                      No hay asistencias registradas aún.
                    </p>
                    <p className="text-sm">
                      Comienza tomando asistencia en la primera pestaña.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "directory" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Directorio de Jóvenes
                  </h2>
                  <div className="flex gap-3">
                    {youths.length > 0 && (
                      <button
                        onClick={exportToExcel}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Exportar a Excel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowAddYouth(true);
                        setEditingYouth(null);
                        setNewYouth({
                          name: "",
                          age: "",
                          phone: "",
                          address: "",
                          birthdate: "",
                          group: "11-14",
                        });
                      }}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Agregar Joven
                    </button>
                  </div>
                </div>

                {showAddYouth && (
                  <div className="bg-blue-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {editingYouth ? "Editar Joven" : "Nuevo Joven"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre completo *"
                        value={newYouth.name}
                        onChange={(e) =>
                          setNewYouth({ ...newYouth, name: e.target.value })
                        }
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Edad *"
                        value={newYouth.age}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (
                            value === "" ||
                            (value.length <= 2 && parseInt(value) >= 0)
                          ) {
                            setNewYouth({ ...newYouth, age: value });
                          }
                        }}
                        min="0"
                        max="99"
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="tel"
                        placeholder="Celular"
                        value={newYouth.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 9) {
                            setNewYouth({ ...newYouth, phone: value });
                          }
                        }}
                        maxLength="9"
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="date"
                        placeholder="Fecha de nacimiento"
                        value={newYouth.birthdate}
                        onChange={(e) =>
                          setNewYouth({
                            ...newYouth,
                            birthdate: e.target.value,
                          })
                        }
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Dirección"
                        value={newYouth.address}
                        onChange={(e) =>
                          setNewYouth({ ...newYouth, address: e.target.value })
                        }
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
                      />
                      <select
                        value={newYouth.group}
                        onChange={(e) =>
                          setNewYouth({ ...newYouth, group: e.target.value })
                        }
                        className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {groups.map((g) => (
                          <option key={g} value={g}>
                            Grupo {g} años
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={
                          editingYouth ? handleUpdateYouth : handleAddYouth
                        }
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        {editingYouth ? "Actualizar" : "Guardar"}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddYouth(false);
                          setEditingYouth(null);
                          setNewYouth({
                            name: "",
                            age: "",
                            phone: "",
                            address: "",
                            birthdate: "",
                            group: "11-14",
                          });
                        }}
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {groups.map((group) => {
                  const groupYouths = youths.filter((y) => y.group === group);
                  if (groupYouths.length === 0) return null;

                  return (
                    <div key={group} className="mb-8">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 bg-blue-50 p-3 rounded-lg">
                        Grupo {group} años ({groupYouths.length} jóvenes)
                      </h3>
                      <div className="grid gap-4">
                        {groupYouths.map((youth) => (
                          <div
                            key={youth.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-bold text-lg text-gray-800">
                                  {youth.name}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm text-gray-600">
                                  <div>
                                    <span className="font-semibold">Edad:</span>{" "}
                                    {youth.age} años
                                  </div>
                                  {youth.phone && (
                                    <div>
                                      <span className="font-semibold">
                                        Celular:
                                      </span>{" "}
                                      {youth.phone}
                                    </div>
                                  )}
                                  {youth.birthdate && (
                                    <div>
                                      <span className="font-semibold">
                                        Nacimiento:
                                      </span>{" "}
                                      {formatDate(youth.birthdate)}
                                    </div>
                                  )}
                                  {youth.address && (
                                    <div className="md:col-span-3">
                                      <span className="font-semibold">
                                        Dirección:
                                      </span>{" "}
                                      {youth.address}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditYouth(youth)}
                                  className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                >
                                  <Edit className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteYouth(youth.id)}
                                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {youths.length === 0 && !showAddYouth && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No hay jóvenes registrados aún.</p>
                    <p className="text-sm">
                      Haz clic en "Agregar Joven" para comenzar.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
