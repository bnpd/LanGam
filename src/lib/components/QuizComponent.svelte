<script lang="ts">
	import { player } from "$lib/stores";
	import { updatePlayer } from "./backend";

    // Hardcoded question and answers for now
    const question = "Which word describes how you feel?";
    const answers = [
        "excited", // First answer is correct
        "sad",
        "happy",
        "angry"
    ];
    const hint = "Your heart beats faster and you think this could be something big."
    let answeredCorrectly: boolean | undefined = undefined;
    let selectedAnswer: string | undefined = undefined;
    let resultDiv: HTMLDivElement;

    $: if (answeredCorrectly !== undefined && resultDiv) {
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }

    // Shuffle the answers
    let shuffledAnswers = [...answers];
    shuffledAnswers.sort(() => Math.random() - 0.5);

    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    function handleAnswer(answer: string) {
        answeredCorrectly = answer === answers[0]
        if ($player && answeredCorrectly) {
            // for correct answer, grant 100 points if first answer, 50 if had answered wrong before
            const pointsGained = !selectedAnswer ? 100 : 50
            $player.stats.points = $player?.stats?.points ? $player.stats.points + pointsGained : pointsGained
            if ($player.id) updatePlayer($player)
            dispatch('points', { points: pointsGained });
        }
        selectedAnswer = answer;
    }
</script>

<div class="quiz-container">
    <small>Checkpoint</small>
    <h2>{question}</h2>
    <div class="answer-buttons">
        {#each shuffledAnswers as answer}
            <button
                on:click={() => handleAnswer(answer)}
                class="answer-button"
                class:correct={selectedAnswer === answer && answeredCorrectly}
                class:incorrect={selectedAnswer === answer && !answeredCorrectly}
                disabled={answeredCorrectly}
            >
                {answer}
            </button>
        {/each}
    </div>
    {#if answeredCorrectly !== undefined}
        <div bind:this={resultDiv}>
            {#if answeredCorrectly}
                <h3>Perfect!</h3>
                <strong>Explanation: </strong>
            {:else}
                <h3>Try again!</h3>
                <strong>Help: </strong>
            {/if}
            <span>{hint}</span>
        </div>
    {:else}
        <small>Correct first attempt earns 100 points</small>
    {/if}
</div>


<style>
    h2, h3 {
        margin: 0;
    }

    .quiz-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 2rem min(2vw, 2rem) 0 min(2vw, 2rem);
        gap: 1rem;
    }

    .answer-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        width: 100%;
    }

    .answer-button {
        border: 1px solid #ccc;
        background-color: #fff;
        cursor: pointer;
        transition: background-color 0.2s;
        min-width: 40%;
        text-align: center;
        display: inline-block;
        flex: 1;
    }

    .answer-button:hover {
        background-color: #f0f0f0;
    }

    .answer-button.correct {
        background-color: #4caf50;
        color: white;
        border-color: #45a049;
    }

    .answer-button.incorrect {
        background-color: #ff9800;
        color: white;
        border-color: #f57c00;
    }
</style>
