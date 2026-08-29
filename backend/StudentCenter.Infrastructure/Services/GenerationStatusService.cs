using System;
using System.Threading;

namespace StudentCenter.Infrastructure.Services
{
    public interface IGenerationStatusService
    {
        bool IsRunning { get; }
        int Total { get; }
        int Completed { get; }
        void Start(int total);
        void Increment();
        void Finish();
    }

    public class GenerationStatusService : IGenerationStatusService
    {
        private int _total;
        private int _completed;
        private int _running; // 0 = not running, 1 = running

        public bool IsRunning => _running > 0;
        public int Total => _total;
        public int Completed => _completed;

        public void Start(int total)
        {
            _total = total;
            _completed = 0;
            Interlocked.Exchange(ref _running, 1);
        }

        public void Increment()
        {
            Interlocked.Increment(ref _completed);
        }

        public void Finish()
        {
            Interlocked.Exchange(ref _running, 0);
            _total = 0;
            _completed = 0;
        }
    }
}
