import React from 'react';

interface PokemonStatsProps {
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
}

interface StatBarProps {
  label: string;
  value: number;
  color: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, color }) => {
  // Ensure value is a number and calculate percentage
  const numericValue = Number(value) || 0;
  const percentage = Math.min((numericValue / 250) * 100, 100); // Use 250 as max value for Pokemon stats
  
  return (
    <div className="flex items-center space-x-2">
      <span className="font-medium w-16 text-sm">{label}:</span>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-in-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm w-8 text-right">{numericValue}</span>
    </div>
  );
};

const PokemonStats: React.FC<PokemonStatsProps> = ({
  hp,
  attack,
  defense,
  speed,
  special,
}) => {
  // Log the received values
  console.log('Pokemon Stats:', { hp, attack, defense, speed, special });
  
  return (
    <div className="space-y-2">
      <StatBar label="HP" value={hp} color="bg-green-500" />
      <StatBar label="Attack" value={attack} color="bg-red-500" />
      <StatBar label="Defense" value={defense} color="bg-blue-500" />
      <StatBar label="Speed" value={speed} color="bg-yellow-400" />
      <StatBar label="Special" value={special} color="bg-purple-500" />
    </div>
  );
};

export default PokemonStats; 