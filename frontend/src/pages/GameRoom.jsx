import React, { useMemo, useState } from "react";
import { Circle, Diamond, Square, Heart} from "lucide-react";
import Navbar_res from "../components/Navbar_res";

const sampleQuestion = {
	id: 1,
	title: "Which planet is known as the Red Planet?",
	timeLeft: 18,
	pin: "123456",
	score: 2450,
	options: [
		{ id: "A", text: "Mars", icon: Circle, color: "bg-[#ec3251]", border: "border-[#ff677f]" },
		{ id: "B", text: "Jupiter", icon: Diamond, color: "bg-[#2da2cc]", border: "border-[#58baf2]" },
		{ id: "C", text: "Venus", icon: Square, color: "bg-[#ecb906]", border: "border-[#f5cb3f]" },
		{ id: "D", text: "Saturn", icon: Heart, color: "bg-[#2bc560]", border: "border-[#57da84]" },
	],
};

const optionSymbol = {
	A: Circle,
	B: Diamond,
	C: Square,
	D: Heart,
};

export default function Question() {
	const [selectedOption, setSelectedOption] = useState(null);

	const options = useMemo(() => sampleQuestion.options, []);

	return (
		<div className="min-h-screen bg-[#f3f4f6] text-slate-900">
            <Navbar_res/>
			<main className="border-t-4 border-[#0d86f6] bg-[#1db987] px-4 pb-10 pt-8 sm:px-8 sm:pb-14">
				<div className="mx-auto max-w-5xl rounded-3xl bg-[#19b682] p-4 shadow-[0_14px_40px_rgba(7,102,72,0.32)] sm:p-6">
					<section className="flex flex-col items-center gap-5 px-2 pt-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
						<div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[#f9ca31] text-6xl font-black text-[#f9ca31]">
							{sampleQuestion.timeLeft}
						</div>
						<h2 className="max-w-3xl text-center text-3xl font-black text-white sm:text-5xl">
							{sampleQuestion.title}
						</h2>
						<div className="hidden h-28 w-28 sm:block" />
					</section>

					<section className="mt-9 grid gap-5 sm:grid-cols-2">
						{options.map((option) => {
							const LeadingIcon = optionSymbol[option.id];
							const SideIcon = option.icon;
							const isSelected = selectedOption === option.id;

							return (
								<button
									key={option.id}
									type="button"
									onClick={() => setSelectedOption(option.id)}
									className={`group relative rounded-3xl border-4 p-6 text-left text-white transition duration-200 ${option.color} ${option.border} ${
										isSelected
											? "ring-4 ring-white/60"
											: "hover:-translate-y-0.5 hover:brightness-105"
									}`}
								>
									<div className="mb-4 flex items-center justify-between">
										<div className="flex items-center gap-3 text-xl font-bold">
											<span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/28">
												<LeadingIcon className="h-5 w-5" />
											</span>
											<span className="text-2xl">{option.id}</span>
										</div>
										<SideIcon className="h-10 w-10 text-white/35" strokeWidth={2.3} />
									</div>
									<div className="text-4xl font-extrabold leading-tight sm:text-[2.1rem]">{option.text}</div>
								</button>
							);
						})}
					</section>
				</div>
			</main>
		</div>
	);
}
