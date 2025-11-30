// BORRÉ LAS LÍNEAS 1 y 2 PORQUE CHOCABAN CON EL CÓDIGO DE ABAJO
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
// Aquí unifiqué todos los imports de auth en uno solo
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBaLYbJKeqgUE89dKPmFAyQJIk_X8tCqJk",
  authDomain: "jnisis.firebaseapp.com",
  projectId: "jnisis",
  storageBucket: "jnisis.firebasestorage.app",
  messagingSenderId: "597624905955",
  appId: "1:597624905955:web:94cba5f2a423f3875da5d6",
};

// Como borramos la línea 1, ahora estas variables SI se pueden crear
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

  // Estados para Tesorería
  const [tithesOfferings, setTithesOfferings] = useState([]);
  const [groupIncomes, setGroupIncomes] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [showAddTithe, setShowAddTithe] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newTithe, setNewTithe] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "adolescentes",
    type: "diezmo",
    amount: "",
    description: "",
  });
  const [newIncome, setNewIncome] = useState({
    date: new Date().toISOString().split("T")[0],
    group: "11-14",
    amount: "",
    description: "",
  });
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: "",
    description: "",
  });

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

  // Timer de cierre de sesión automático a los 15 minutos
  useEffect(() => {
    if (user) {
      const logoutTimer = setTimeout(() => {
        handleLogout();
        alert("Tu sesión ha expirado después de 15 minutos");
      }, 900000);

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
      setTithesOfferings([]);
      setGroupIncomes([]);
      setGeneralExpenses([]);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const importInitialData = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de importar 72 jóvenes? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setLoading(true);

    const youths = [
      // Grupo 11-14
      {
        name: "Rumiche Sarango Valery",
        phone: "",
        address: "Fe y Alegría Mz J lote 27, Paita",
        birthdate: "2011-01-18",
        group: "11-14",
      },
      {
        name: "Chininin Gonzales Luis",
        phone: "",
        address: "Fe y Alegría Mz A lote 11, Paita",
        birthdate: "2011-09-12",
        group: "11-14",
      },
      {
        name: "Pasapera Almestar David",
        phone: "",
        address: "Tablazo Mz J lote 13, Paita",
        birthdate: "2011-05-14",
        group: "11-14",
      },
      {
        name: "Atoche Gomez Carlos",
        phone: "",
        address: "Ramón Castilla Mz H lote 30, Paita",
        birthdate: "2011-07-17",
        group: "11-14",
      },
      {
        name: "Yarlequé Zapata Ruth",
        phone: "",
        address: "Consuelo de velazco Mz L lote 13, Paita",
        birthdate: "2011-08-04",
        group: "11-14",
      },
      {
        name: "Bautista Miñan Leonel",
        phone: "",
        address: "Consuelo de velazco Mz O lote 6, Paita",
        birthdate: "2012-05-16",
        group: "11-14",
      },
      {
        name: "Silva Miñan Neymar",
        phone: "",
        address: "Consuelo de velazco Mz R lote 25, Paita",
        birthdate: "2012-03-31",
        group: "11-14",
      },
      {
        name: "Valladares Atarama Jesús",
        phone: "",
        address: "Nuevo Porvenir Mz H lote 22, Paita",
        birthdate: "2012-03-27",
        group: "11-14",
      },
      {
        name: "Maza Nuñez Christell",
        phone: "",
        address: "Consuelo de velazco Mz I lote 28, Paita",
        birthdate: "2012-03-01",
        group: "11-14",
      },
      {
        name: "Maza Adanaque Nahomy",
        phone: "",
        address: "Consuelo de velazco Mz L lote 32, Paita",
        birthdate: "2011-12-10",
        group: "11-14",
      },
      {
        name: "Chamba Quinde Esther Noemi",
        phone: "",
        address: "Nuevo Porvenir Mz H1 lote 30, Paita",
        birthdate: "2010-12-21",
        group: "11-14",
      },
      {
        name: "Flores Huaman Stiven Yael",
        phone: "",
        address: "Nuevo Porvenir Mz H lote 14, Paita",
        birthdate: "2013-08-30",
        group: "11-14",
      },
      {
        name: "Carmen Sandoval Sarely Mabell",
        phone: "",
        address: "Consuelo de Velazco Mz Z lote 17, Paita",
        birthdate: "2013-04-09",
        group: "11-14",
      },
      {
        name: "Yoclla Castillo Astrid Kaori",
        phone: "",
        address: "Nuevo horizonte Mz I lote 05, Paita",
        birthdate: "2013-06-02",
        group: "11-14",
      },

      // Grupo 15-18
      {
        name: "Valladolin Rivas Jean Franco",
        phone: "",
        address: "Consuelo de Velasco Mz L lote 30, Paita",
        birthdate: "2010-07-01",
        group: "15-18",
      },
      {
        name: "Zapata Dioses Genesis",
        phone: "",
        address: "Marco Jara Mz Ñ lote 8, Paita",
        birthdate: "2009-04-16",
        group: "15-18",
      },
      {
        name: "Gonza Orozco Yojan",
        phone: "",
        address: "Consuelo de Velasco Mz K lote 26, Paita",
        birthdate: "2009-03-29",
        group: "15-18",
      },
      {
        name: "Vilchez Sánchez Angello Leonel",
        phone: "",
        address: "Viña del Señor Mz V lote 20, Paita",
        birthdate: "2010-01-28",
        group: "15-18",
      },
      {
        name: "Castillo Lima Felipe",
        phone: "",
        address: "Alfonso Ugarte Mz X lote 6, Paita",
        birthdate: "2007-05-23",
        group: "15-18",
      },
      {
        name: "Nolasco Sánchez Jeremy",
        phone: "",
        address: "Manuelita Saenz Mz Y2 lote 2, Paita",
        birthdate: "2008-07-20",
        group: "15-18",
      },
      {
        name: "Valladolid Rivas Adrian",
        phone: "",
        address: "Consuelo de Velasco Mz I lote 30, Paita",
        birthdate: "2008-08-10",
        group: "15-18",
      },
      {
        name: "Cruz Samamé Jhoselyn",
        phone: "",
        address: "San Martin Central Mz M lote 8, Paita",
        birthdate: "2008-03-10",
        group: "15-18",
      },
      {
        name: "Silva Miñan Franklyn",
        phone: "",
        address: "Consuelo de Velasco Mz R lote 25, Paita",
        birthdate: "2007-11-29",
        group: "15-18",
      },
      {
        name: "Inga Ramirez Karol",
        phone: "",
        address: "Villa Jardin Mz E lote 3, Paita",
        birthdate: "2008-03-22",
        group: "15-18",
      },
      {
        name: "Valladares Atarama Arnold",
        phone: "",
        address: "Nuevo Porvenir Mz H lote 22, Paita",
        birthdate: "2008-01-12",
        group: "15-18",
      },
      {
        name: "Chuquihuanga Castillo Melany",
        phone: "",
        address: "Nuevo Porvenir Mz H lote 25, Paita",
        birthdate: "2009-01-29",
        group: "15-18",
      },
      {
        name: "Pazo Cruz Josue Adrián",
        phone: "",
        address: "1 de junio Mz W lote 17, Paita",
        birthdate: "2009-07-13",
        group: "15-18",
      },
      {
        name: "Cunya Medina Nicol",
        phone: "",
        address: "Consuelo de Velasco Mz K lote 15, Paita",
        birthdate: "2009-01-21",
        group: "15-18",
      },
      {
        name: "Juarez Noe Mariana",
        phone: "",
        address: "Dos de Agosto Mz B1 lote 16, Paita",
        birthdate: "2007-08-22",
        group: "15-18",
      },
      {
        name: "Ramos Ramirez Rosa Amelia",
        phone: "",
        address: "Los Jardines Mz E lote 3, Paita",
        birthdate: "2009-01-01",
        group: "15-18",
      },
      {
        name: "Manuyama Bautista Alex",
        phone: "",
        address: "Consuelo de Velasco Mz O lote 5, Paita",
        birthdate: "2007-03-09",
        group: "15-18",
      },
      {
        name: "Llacsahuache Maza David",
        phone: "",
        address: "Nuevo Porvenir Mz G lote 10, Paita",
        birthdate: "2007-10-10",
        group: "15-18",
      },
      {
        name: "Cherres Adanaque Diego Freddy",
        phone: "",
        address: "AA.HH Los Jardines Mz A lote 13, Paita",
        birthdate: "2007-12-12",
        group: "15-18",
      },
      {
        name: "Duque Garabito Greysi Anahí",
        phone: "",
        address: "Consuelo de Velasco Mz H lote 31, Paita",
        birthdate: "2009-12-24",
        group: "15-18",
      },
      {
        name: "Yarlequé Zapata Ariana",
        phone: "",
        address: "Consuelo de Velasco Mz L lote 13, Paita",
        birthdate: "2008-12-13",
        group: "15-18",
      },
      {
        name: "Miñan Coveñas Jharosaly",
        phone: "",
        address: "José Olaya Mz B lote 9, Paita",
        birthdate: "2010-04-12",
        group: "15-18",
      },
      {
        name: "López Patiño Rut Yaqueline",
        phone: "",
        address: "Consuelo de Velasco Mz L lote 14, Paita",
        birthdate: "2009-10-29",
        group: "15-18",
      },
      {
        name: "Valle chuquihuanga Dana",
        phone: "",
        address: "Consuelo de Velasco Mz K lote 27, Paita",
        birthdate: "2010-05-24",
        group: "15-18",
      },
      {
        name: "Alvarado Cruz Brendy Zarely",
        phone: "",
        address: "29 de diciembre Mz R lote 15, Paita",
        birthdate: "2010-10-09",
        group: "15-18",
      },
      {
        name: "Pita Novillo Danitza",
        phone: "",
        address: "Nuevo Porvenir Mz H lote 5, Paita",
        birthdate: "2010-05-24",
        group: "15-18",
      },

      // Grupo 19-22
      {
        name: "Ramirez Vite Angie",
        phone: "",
        address: "Nuevo Porvenir Mz H lote 5, Paita",
        birthdate: "2005-11-28",
        group: "19-22",
      },
      {
        name: "Atoche Gomez Karen Priscila",
        phone: "",
        address: "Ramón Castilla Mz L lote 30, Paita",
        birthdate: "2005-05-09",
        group: "19-22",
      },
      {
        name: "Chuica Adanaque Treysi",
        phone: "",
        address: "AA.HH Los jardines Mz A lote 17, Paita",
        birthdate: "2004-12-03",
        group: "19-22",
      },
      {
        name: "Chamba Quinde Danverly Angiely",
        phone: "",
        address: "Nuevo Porvenir Mz H1 lote 30, Paita",
        birthdate: "2007-03-11",
        group: "19-22",
      },
      {
        name: "Sánchez Herrera Jhonatan",
        phone: "",
        address: "Manuelita Saenz Mz Y2 lt 12, Paita",
        birthdate: "2003-02-13",
        group: "19-22",
      },
      {
        name: "Ontaneda Lloclla Elkin",
        phone: "",
        address: "Nuevo Porvenir Mz F lote 12, Paita",
        birthdate: "2005-05-18",
        group: "19-22",
      },
      {
        name: "Valladolid Rivas Jhon",
        phone: "",
        address: "Consuelo de Velasco Mz I lote 30, Paita",
        birthdate: "2006-08-28",
        group: "19-22",
      },
      {
        name: "Alejabo More Ivone Jahaira",
        phone: "",
        address: "Viña del señor Mz U lote 2, Paita",
        birthdate: "2002-11-15",
        group: "19-22",
      },
      {
        name: "Juarez Noé Isaías",
        phone: "",
        address: "Dos de agosto Mz B lote 26, Paita",
        birthdate: "2004-03-02",
        group: "19-22",
      },
      {
        name: "Pazo Cruz Juan Arnie",
        phone: "",
        address: "1 de junio Mz W lote 17, Paita",
        birthdate: "2003-07-07",
        group: "19-22",
      },
      {
        name: "Cherres Adanaque Karen",
        phone: "",
        address: "AA.HH Los Jardines Mz A lote 15, Paita",
        birthdate: "2006-01-22",
        group: "19-22",
      },

      // Grupo 23-40
      {
        name: "Rosales Cordova Karen Leydi",
        phone: "",
        address: "Nuevo Porvenir Mz G lote 33, Paita",
        birthdate: "2000-02-20",
        group: "23-40",
      },
      {
        name: "García Salvador José María",
        phone: "",
        address: "Marco Jara I Etapa Mz Y lote 04, Paita",
        birthdate: "2002-03-24",
        group: "23-40",
      },
      {
        name: "Rumiche Periche Luz",
        phone: "",
        address: "La Molina Mz B lote 6, Paita",
        birthdate: "2001-01-02",
        group: "23-40",
      },
      {
        name: "Maza Culquicondor Yeyver",
        phone: "",
        address: "Nuevo Porvenir Mz G lote 17, Paita",
        birthdate: "2001-09-10",
        group: "23-40",
      },
      {
        name: "Maza Culquicondor Danny",
        phone: "",
        address: "Nuevo Porvenir Mz G lote 17, Paita",
        birthdate: "1997-01-18",
        group: "23-40",
      },
      {
        name: "Flores Huacchillo Heinner",
        phone: "",
        address: "Nuevo Porvenir Mz C lote 19, Paita",
        birthdate: "1998-12-14",
        group: "23-40",
      },
      {
        name: "Zapata Dioses Juan Martín",
        phone: "",
        address: "Marco Jara I Etapa Mz Ñ lote 8, Paita",
        birthdate: "2001-05-25",
        group: "23-40",
      },
      {
        name: "Zapata Dioses Jefferson",
        phone: "",
        address: "Marco Jara I Etapa Mz Ñ lote 8, Paita",
        birthdate: "1997-01-24",
        group: "23-40",
      },
      {
        name: "Véliz Lequernaque Paolo Josué",
        phone: "",
        address: "San Martin Occidente N° 112, Paita",
        birthdate: "1998-09-10",
        group: "23-40",
      },
      {
        name: "Fiestas Girón Jhony",
        phone: "",
        address: "A.H Hermanos Carcamos Mz M lote 3, Paita",
        birthdate: "1996-06-14",
        group: "23-40",
      },
      {
        name: "Villegas Carrillo Mabeck",
        phone: "",
        address: "Los Jazmines Mz C lote 18, Paita",
        birthdate: "2004-02-26",
        group: "23-40",
      },
      {
        name: "Vargas Sánchez Graciela",
        phone: "",
        address: "A.H Hermanos Carcamos Mz O lote 12, Paita",
        birthdate: "1998-01-09",
        group: "23-40",
      },
      {
        name: "García Salvador Franscisco",
        phone: "",
        address: "Marco Jara I Etapa Mz Y lote 04, Paita",
        birthdate: "1994-08-25",
        group: "23-40",
      },
      {
        name: "Rosales Cordova Fernando",
        phone: "",
        address: "Nuevo Porvenir Mz G lote 33, Paita",
        birthdate: "2001-11-22",
        group: "23-40",
      },
      {
        name: "Yamunaque Umbo Jhen",
        phone: "",
        address: "1 de junio Mz B lote 1, Paita",
        birthdate: "1993-11-06",
        group: "23-40",
      },
      {
        name: "Rondoy Guayanay Edwar Enrique",
        phone: "",
        address: "Paita",
        birthdate: "2002-01-09",
        group: "23-40",
      },
      {
        name: "Colàn Amaya Armando",
        phone: "",
        address: "Juan Valer Mz A lote 6, Paita",
        birthdate: "2004-05-12",
        group: "23-40",
      },
      {
        name: "Fiestas Ipanaque Luz",
        phone: "",
        address: "Villa Hermosa Mz A lote 1, Paita",
        birthdate: "2004-10-21",
        group: "23-40",
      },
      {
        name: "Ramirez Vite Jefferson",
        phone: "",
        address: "Los Jardinez Mz B lote 1, Paita",
        birthdate: "2004-03-20",
        group: "23-40",
      },
      {
        name: "Juarez More Luis Alberto",
        phone: "",
        address: "San Martin Central Mz I lote 44, Paita",
        birthdate: "1984-09-30",
        group: "23-40",
      },
      {
        name: "Juarez More Luis Pablo",
        phone: "",
        address: "San Martin Central Mz I lote 44, Paita",
        birthdate: "1990-10-06",
        group: "23-40",
      },
    ];

    let successCount = 0;
    let errorCount = 0;

    try {
      for (const youth of youths) {
        try {
          const youthData = {
            ...youth,
            userId: user.uid,
            createdAt: new Date().toISOString(),
          };

          await addDoc(collection(db, "youths"), youthData);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Error con ${youth.name}:`, error);
        }
      }

      alert(
        `✅ Importación completada!\n\n✅ Exitosos: ${successCount}\n❌ Errores: ${errorCount}`
      );

      // Recargar los datos
      loadData(user.uid);
    } catch (error) {
      console.error("Error en importación:", error);
      alert("Error durante la importación");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (userId) => {
    setLoading(true);
    try {
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

      const tithesQuery = query(
        collection(db, "tithes-offerings"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const tithesSnapshot = await getDocs(tithesQuery);
      const tithesData = tithesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTithesOfferings(tithesData);

      const incomesQuery = query(
        collection(db, "group-incomes"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const incomesSnapshot = await getDocs(incomesQuery);
      const incomesData = incomesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroupIncomes(incomesData);

      const expensesQuery = query(
        collection(db, "general-expenses"),
        where("userId", "==", userId),
        orderBy("date", "desc")
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const expensesData = expensesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGeneralExpenses(expensesData);
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
        userId: user.uid,
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
        userId: user.uid,
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

  const handleAddTithe = async () => {
    if (!newTithe.amount || parseFloat(newTithe.amount) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    try {
      const tithe = {
        ...newTithe,
        amount: parseFloat(newTithe.amount),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "tithes-offerings"), tithe);
      const newTitheWithId = { id: docRef.id, ...tithe };

      setTithesOfferings([newTitheWithId, ...tithesOfferings]);
      setNewTithe({
        date: new Date().toISOString().split("T")[0],
        category: "adolescentes",
        type: "diezmo",
        amount: "",
        description: "",
      });
      setShowAddTithe(false);
      alert("Registro guardado correctamente");
    } catch (error) {
      console.error("Error guardando registro:", error);
      alert("Error al guardar registro");
    }
  };

  const handleAddIncome = async () => {
    if (!newIncome.amount || parseFloat(newIncome.amount) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    try {
      const income = {
        ...newIncome,
        amount: parseFloat(newIncome.amount),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "group-incomes"), income);
      const newIncomeWithId = { id: docRef.id, ...income };

      setGroupIncomes([newIncomeWithId, ...groupIncomes]);
      setNewIncome({
        date: new Date().toISOString().split("T")[0],
        group: "11-14",
        amount: "",
        description: "",
      });
      setShowAddIncome(false);
      alert("Ingreso guardado correctamente");
    } catch (error) {
      console.error("Error guardando ingreso:", error);
      alert("Error al guardar ingreso");
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    try {
      const expense = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "general-expenses"), expense);
      const newExpenseWithId = { id: docRef.id, ...expense };

      setGeneralExpenses([newExpenseWithId, ...generalExpenses]);
      setNewExpense({
        date: new Date().toISOString().split("T")[0],
        amount: "",
        description: "",
      });
      setShowAddExpense(false);
      alert("Gasto guardado correctamente");
    } catch (error) {
      console.error("Error guardando gasto:", error);
      alert("Error al guardar gasto");
    }
  };

  const deleteTransaction = async (
    id,
    collection_name,
    setState,
    currentState
  ) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;

    try {
      await deleteDoc(doc(db, collection_name, id));
      setState(currentState.filter((item) => item.id !== id));
      alert("Registro eliminado exitosamente");
    } catch (error) {
      console.error("Error eliminando registro:", error);
      alert("Error al eliminar registro");
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

          <div className="flex border-b bg-gray-50 overflow-x-auto">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
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
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
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
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === "directory"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Users className="w-5 h-5" />
              Directorio
            </button>
            <button
              onClick={() => setActiveTab("treasury")}
              className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === "treasury"
                  ? "bg-white text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Tesorería
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
                            stroke="#f59e0b"
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
                            stroke="#8b5cf6"
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
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
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
                    {youths.length === 0 && (
                      <button
                        onClick={importInitialData}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Importar 72 Jóvenes
                      </button>
                    )}
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

            {activeTab === "treasury" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Tesorería
                </h2>

                {/* Sección 1: Diezmos y Ofrendas */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700">
                      Diezmos y Ofrendas
                    </h3>
                    <button
                      onClick={() => setShowAddTithe(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      + Agregar Registro
                    </button>
                  </div>

                  {showAddTithe && (
                    <div className="bg-blue-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">
                        Nuevo Registro
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={newTithe.date}
                          onChange={(e) =>
                            setNewTithe({ ...newTithe, date: e.target.value })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <select
                          value={newTithe.category}
                          onChange={(e) =>
                            setNewTithe({
                              ...newTithe,
                              category: e.target.value,
                            })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="adolescentes">
                            Adolescentes (11-14)
                          </option>
                          <option value="jovenes-adultos">
                            Jóvenes y Adultos (15-40)
                          </option>
                        </select>
                        <select
                          value={newTithe.type}
                          onChange={(e) =>
                            setNewTithe({ ...newTithe, type: e.target.value })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="diezmo">Diezmo</option>
                          <option value="ofrenda">Ofrenda</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Monto *"
                          value={newTithe.amount}
                          onChange={(e) =>
                            setNewTithe({ ...newTithe, amount: e.target.value })
                          }
                          min="0"
                          step="0.01"
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Descripción (opcional)"
                          value={newTithe.description}
                          onChange={(e) =>
                            setNewTithe({
                              ...newTithe,
                              description: e.target.value,
                            })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
                        />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddTithe}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setShowAddTithe(false);
                            setNewTithe({
                              date: new Date().toISOString().split("T")[0],
                              category: "adolescentes",
                              type: "diezmo",
                              amount: "",
                              description: "",
                            });
                          }}
                          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {tithesOfferings.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">
                            {item.type === "diezmo"
                              ? "📖 Diezmo"
                              : "🙏 Ofrenda"}{" "}
                            -
                            {item.category === "adolescentes"
                              ? " Adolescentes"
                              : " Jóvenes y Adultos"}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatDate(item.date)} • S/{" "}
                            {item.amount.toFixed(2)}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            deleteTransaction(
                              item.id,
                              "tithes-offerings",
                              setTithesOfferings,
                              tithesOfferings
                            )
                          }
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {tithesOfferings.length === 0 && !showAddTithe && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay registros de diezmos u ofrendas aún.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Total Adolescentes
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        S/{" "}
                        {tithesOfferings
                          .filter((t) => t.category === "adolescentes")
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Total Jóvenes y Adultos
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        S/{" "}
                        {tithesOfferings
                          .filter((t) => t.category === "jovenes-adultos")
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Ingresos por Grupo */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700">
                      Ingresos por Grupo
                    </h3>
                    <button
                      onClick={() => setShowAddIncome(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      + Agregar Ingreso
                    </button>
                  </div>

                  {showAddIncome && (
                    <div className="bg-green-50 rounded-xl p-6 mb-6 border-2 border-green-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">
                        Nuevo Ingreso
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={newIncome.date}
                          onChange={(e) =>
                            setNewIncome({ ...newIncome, date: e.target.value })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <select
                          value={newIncome.group}
                          onChange={(e) =>
                            setNewIncome({
                              ...newIncome,
                              group: e.target.value,
                            })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                        >
                          <option value="11-14">Grupo 11-14 años</option>
                          <option value="15-18">Grupo 15-18 años</option>
                          <option value="19-22">Grupo 19-22 años</option>
                          <option value="23-40">Grupo 23-40 años</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Monto *"
                          value={newIncome.amount}
                          onChange={(e) =>
                            setNewIncome({
                              ...newIncome,
                              amount: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Descripción (opcional)"
                          value={newIncome.description}
                          onChange={(e) =>
                            setNewIncome({
                              ...newIncome,
                              description: e.target.value,
                            })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddIncome}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setShowAddIncome(false);
                            setNewIncome({
                              date: new Date().toISOString().split("T")[0],
                              group: "11-14",
                              amount: "",
                              description: "",
                            });
                          }}
                          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {groupIncomes.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">
                            💰 Ingreso - Grupo {item.group}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatDate(item.date)} • S/{" "}
                            {item.amount.toFixed(2)}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            deleteTransaction(
                              item.id,
                              "group-incomes",
                              setGroupIncomes,
                              groupIncomes
                            )
                          }
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {groupIncomes.length === 0 && !showAddIncome && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay ingresos registrados aún.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {["11-14", "15-18", "19-22", "23-40"].map((group) => {
                      const totalIngresos = groupIncomes
                        .filter((i) => i.group === group)
                        .reduce((sum, i) => sum + i.amount, 0);

                      return (
                        <div key={group} className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Grupo {group}
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            S/ {totalIngresos.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sección 3: Gastos Generales */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-700">
                      Gastos Generales
                    </h3>
                    <button
                      onClick={() => setShowAddExpense(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      + Agregar Gasto
                    </button>
                  </div>

                  {showAddExpense && (
                    <div className="bg-red-50 rounded-xl p-6 mb-6 border-2 border-red-200">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">
                        Nuevo Gasto General
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              date: e.target.value,
                            })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Monto *"
                          value={newExpense.amount}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              amount: e.target.value,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Descripción (opcional)"
                          value={newExpense.description}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              description: e.target.value,
                            })
                          }
                          className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 outline-none md:col-span-2"
                        />
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddExpense}
                          className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setShowAddExpense(false);
                            setNewExpense({
                              date: new Date().toISOString().split("T")[0],
                              amount: "",
                              description: "",
                            });
                          }}
                          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {generalExpenses.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-semibold text-gray-800">
                            💸 Gasto General
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatDate(item.date)} • S/{" "}
                            {item.amount.toFixed(2)}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            deleteTransaction(
                              item.id,
                              "general-expenses",
                              setGeneralExpenses,
                              generalExpenses
                            )
                          }
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {generalExpenses.length === 0 && !showAddExpense && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No hay gastos registrados aún.</p>
                      </div>
                    )}
                  </div>

                  {/* Balance General */}
                  <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Balance General
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">
                          Total Ingresos
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          S/{" "}
                          {groupIncomes
                            .reduce((sum, i) => sum + i.amount, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Total Gastos
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          S/{" "}
                          {generalExpenses
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          Balance Final
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            groupIncomes.reduce((sum, i) => sum + i.amount, 0) -
                              generalExpenses.reduce(
                                (sum, e) => sum + e.amount,
                                0
                              ) >=
                            0
                              ? "text-blue-600"
                              : "text-red-600"
                          }`}
                        >
                          S/{" "}
                          {(
                            groupIncomes.reduce((sum, i) => sum + i.amount, 0) -
                            generalExpenses.reduce(
                              (sum, e) => sum + e.amount,
                              0
                            )
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
