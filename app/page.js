"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function Home() {
  const { data: session } = useSession();

  const [parties, setParties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date());
  const [max, setMax] = useState(4);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [nickname, setNickname] = useState("");
  const [nicknameLocked, setNicknameLocked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nickname");
    const locked = localStorage.getItem("nicknameLocked");

    if (saved) setNickname(saved);
    if (locked) setNicknameLocked(true);
  }, []);

  const fetchParties = async () => {
    const snapshot = await getDocs(collection(db, "parties"));
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setParties(data);
  };

  useEffect(() => {
    fetchParties();
  }, []);

  const createParty = async () => {
    if (!title) return;

    await addDoc(collection(db, "parties"), {
      title,
      desc,
      members: [],
      max,
      date: date.toISOString(),
      host: nickname || session.user.name,
      image: "/logo.png",
      ended: false,
    });

    setShowModal(false);
    setTitle("");
    setDesc("");
    fetchParties();
  };

  const joinParty = async (id) => {
    await updateDoc(doc(db, "parties", id), {
      members: arrayUnion(nickname || session.user.name),
    });
    fetchParties();
  };

  const leaveParty = async (id) => {
    await updateDoc(doc(db, "parties", id), {
      members: arrayRemove(nickname || session.user.name),
    });
    fetchParties();
  };

  const deleteParty = async (id) => {
    await deleteDoc(doc(db, "parties", id));
    fetchParties();
  };

  const endParty = async (id) => {
    await updateDoc(doc(db, "parties", id), {
      ended: true,
    });
    fetchParties();
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button onClick={() => signIn("discord")} className="neon-btn">
          🎮 디코 로그인
        </button>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">

      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl neon-text font-bold">
          도파민 종합게임방 🎮
        </h1>

        <div className="flex gap-3 items-center">
          <p>{nickname || session.user.name}</p>
          <button onClick={() => signOut()} className="neon-btn">
            로그아웃
          </button>
        </div>
      </div>

      {/* 닉네임 입력 (1회) */}
      {!nicknameLocked && (
        <div className="mb-6 flex gap-2">
          <input
            placeholder="디코 서버 닉네임 입력 (1회만 가능)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-3 border border-gray-600 rounded bg-transparent text-white"
          />

          <button
            onClick={() => {
              if (!nickname) return;
              localStorage.setItem("nickname", nickname);
              localStorage.setItem("nicknameLocked", "true");
              setNicknameLocked(true);
            }}
            className="neon-btn"
          >
            저장
          </button>
        </div>
      )}

      {/* 캘린더 */}
      <div className="neon-card p-4 mb-6">
        <Calendar
          onChange={(value) => setSelectedDate(value)}
          value={selectedDate}
          formatDay={(locale, date) => date.getDate()} // 🔥 숫자만 표시
          formatShortWeekday={(locale, date) =>
            ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
          }
        />
      </div>

      {/* 생성 버튼 */}
      <button
        onClick={() => setShowModal(true)}
        className="neon-btn w-full mb-6"
      >
        + 파티 모집하기
      </button>

      {/* 리스트 */}
      <div className="space-y-4">
        {parties
          .filter((p) => {
            if (!p.date) return false;
            const d = new Date(p.date);
            return d.toDateString() === selectedDate.toDateString();
          })
          .map((p) => (
            <div
              key={p.id}
              className="neon-card p-5 flex justify-between items-center"
            >
              <div className="flex gap-4 items-center">

                <img
                  src={p.image}
                  className="w-28 h-20 rounded-lg object-cover border border-purple-500"
                />

                <div>
                  <p className="text-lg font-semibold">{p.title}</p>

                  {p.ended && (
                    <p className="text-red-400 text-sm">
                      🚫 종료된 파티
                    </p>
                  )}

                  <p className="text-sm text-gray-400">
                    {new Date(p.date)
                      .toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                      .replace(/\./g, "")}
                  </p>

                  <p className="text-sm text-gray-400">
                    인원 {p.members.length} / {p.max}
                  </p>

                  <p className="text-xs text-gray-400">
                    {p.members.length > 0
                      ? p.members.join(", ")
                      : "참여자 없음"}
                  </p>

                  <p className="text-xs text-purple-300">
                    {p.desc}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                {p.ended ? (
                  <span className="text-gray-400">종료됨</span>
                ) : p.members.includes(nickname || session.user.name) ? (
                  <button
                    onClick={() => leaveParty(p.id)}
                    className="neon-btn bg-red-500"
                  >
                    취소
                  </button>
                ) : (
                  <button
                    onClick={() => joinParty(p.id)}
                    className="neon-btn"
                  >
                    참여
                  </button>
                )}

                {p.host === (nickname || session.user.name) && (
                  <>
                    {!p.ended && (
                      <button
                        onClick={() => endParty(p.id)}
                        className="text-yellow-400"
                      >
                        종료
                      </button>
                    )}
                    <button
                      onClick={() => deleteParty(p.id)}
                      className="text-red-400"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="modal-bg">
          <div className="modal">

            <h2 className="mb-4 text-lg">파티 모집</h2>

            <input
              placeholder="게임 이름"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-transparent border border-gray-600 text-white mb-3 rounded"
            />

            <input
              type="datetime-local"
              onChange={(e) => setDate(new Date(e.target.value))}
              className="w-full p-2 bg-transparent border border-gray-600 text-white mb-3 rounded"
            />

            <textarea
              placeholder="기타 내용"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2 bg-transparent border border-gray-600 text-white mb-3 rounded"
            />

            <input
              type="range"
              min="2"
              max="20"
              value={max}
              onChange={(e) => setMax(Number(e.target.value))}
              className="w-full"
            />

            <p className="text-sm">최대 인원: {max}</p>

            <button
              onClick={createParty}
              className="neon-btn w-full mt-4"
            >
              모집 등록하기
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="mt-2 w-full text-gray-400"
            >
              취소
            </button>

          </div>
        </div>
      )}
    </div>
  );
}